// contexts/ScanningContext.js
import React, { createContext, useState, useContext, useRef, useEffect, useCallback } from 'react';

const ScanningContext = createContext();

export function ScanningContextProvider({ children }) {
  const [isScanning, setIsScanning] = useState(false); // A varredura está ativa?
  const [scanIndex, setScanIndex] = useState(-1);      // Índice do item atualmente destacado (-1 = nenhum)
  const [scanSpeed, setScanSpeed] = useState(1500);    // Velocidade em ms (ex: 1.5 segundos)
  const [scannableElements, setScannableElements] = useState([]); // Array de refs dos elementos escaneáveis
  const timerRef = useRef(null); // Ref para o ID do intervalo (setInterval)
  const globalLongPressTimerRef = useRef(null);
  const GLOBAL_LONG_PRESS_DELAY = 1000;

  // Função para limpar o timer e resetar o índice
  const stopScanCycle = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setScanIndex(-1);
  }, []);


  // Função para registrar os elementos que DEVEM ser escaneados
  const registerScannableElements = useCallback((elementRefs) => {
    const validRefs = Array.isArray(elementRefs) ? elementRefs.filter(ref => ref?.current) : [];
    setScannableElements(validRefs);
    console.log(`ScanningContext: ${validRefs.length} elementos registrados.`);
    // Se a varredura já estava ativa com outros elementos, resetar o índice
    if (isScanning) {
        setScanIndex(-1); // Força reinício ou ajuste no useEffect abaixo
    }
  }, []); // Depende de isScanning para resetar índice corretamente


  // Função para parar a varredura
  const stopScanning = useCallback(() => {
    console.log("Parando varredura.");
    setIsScanning(false);
  }, []);


  // Função para limpar os elementos registrados (ex: quando o Board desmontar)
  const clearScannableElements = useCallback(() => {
    console.log("ScanningContext: Limpando elementos registrados.");
    setScannableElements([]);
    stopScanning(); // Para a varredura se estava ativa
  }, [stopScanning]); // Precisa incluir stopScanning se chamado dentro


  // Função para iniciar a varredura (NÃO recebe mais refs como argumento)
  const startScanning = useCallback(() => {
    // Verifica se TEM elementos registrados no estado
    if (scannableElements.length > 0) {
      console.log(`ScanningContext: Iniciando varredura com ${scannableElements.length} elementos registrados.`);
      setIsScanning(true); // Ativa a varredura (o useEffect cuidará do timer)
    } else {
      console.warn("ScanningContext: Tentativa de iniciar varredura sem elementos registrados.");
    }
  }, [scannableElements]); // Depende dos elementos registrados


  


  // Efeito para controlar o ciclo da varredura (timer)
  useEffect(() => {
    // Se a varredura NÃO está ativa, limpa tudo
    if (!isScanning) {
      stopScanCycle();
      return;
    }

    // Se não há elementos para escanear, para
    if (scannableElements.length === 0) {
      setIsScanning(false); // Desativa se não há o que escanear
      return;
    }

    // Inicia o ciclo (começa do primeiro elemento)
    setScanIndex(0); // Começa destacando o primeiro
    timerRef.current = setInterval(() => {
      setScanIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % scannableElements.length;
        return nextIndex;
      });
    }, scanSpeed);

    // Função de limpeza: para o timer quando o efeito terminar
    return () => {
      stopScanCycle();
    };
    // Dependências: reiniciar se isScanning mudar, a lista de elementos mudar, ou a velocidade mudar
  }, [isScanning, scannableElements, scanSpeed, stopScanCycle]);


  // Efeito para destacar visualmente e rolar para o elemento
   useEffect(() => {
    if (isScanning && scanIndex >= 0 && scannableElements[scanIndex]?.current) {
      scannableElements.forEach((ref, index) => {
        if (ref.current) {
          if (index === scanIndex) {
            ref.current.classList.add('scanned-highlight'); // Adiciona classe de destaque
            // Opcional: Rolar para o elemento se estiver fora da vista
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            ref.current.classList.remove('scanned-highlight'); // Remove de outros
          }
        }
      });
    } else {
        // Remove destaque de todos se a varredura parar ou índice for inválido
         scannableElements.forEach(ref => {
            if (ref.current) {
                ref.current.classList.remove('scanned-highlight');
            }
         });
    }
   }, [scanIndex, isScanning, scannableElements]); // Roda quando o índice ou estado muda


  // Função para selecionar o item atualmente destacado
  const selectCurrentItem = useCallback(() => {
    if (isScanning && scanIndex >= 0 && scannableElements[scanIndex]?.current) {
      console.log(`Selecionando item no índice ${scanIndex}`);
      // Simula um clique no elemento destacado
      scannableElements[scanIndex].current.click();
      // Opcional: Parar a varredura após a seleção? Depende do modo desejado.
      // stopScanning();
    }
  }, [isScanning, scanIndex, scannableElements]); // Removido stopScanning das dependências aqui


  // Adiciona listener global para seleção (ex: clique na tela ou tecla específica)
  useEffect(() => {
    const handleSelectionInput = (event) => {
      // Se a varredura estiver ativa, qualquer clique/toque/tecla seleciona
      if (isScanning) {
        // Previne comportamento padrão se for um clique em algo interativo
        // que não seja o próprio item sendo selecionado
        // event.preventDefault(); // Use com cautela, pode impedir outras interações
        selectCurrentItem();
      }
    };

    // Exemplo: Ouvir por cliques na tela inteira
    document.addEventListener('click', handleSelectionInput);
    // Exemplo: Ouvir pela tecla Espaço ou Enter
    const handleKeyDown = (event) => {
        if (isScanning && (event.key === ' ' || event.key === 'Enter')) {
            event.preventDefault(); // Previne scroll ou ativação de botão padrão
            selectCurrentItem();
        }
    }
    document.addEventListener('keydown', handleKeyDown);


    return () => {
      document.removeEventListener('click', handleSelectionInput);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isScanning, selectCurrentItem]); // Adiciona/remove listener baseado no estado isScanning


  // useEffect para long press:
  useEffect(() => {
    // Handler para iniciar o timer de parada
    const handleGlobalPressStart = (event) => {
      // Só inicia o timer se a varredura estiver ATIVA
      if (!isScanning) return;

      // Limpa timer anterior se houver (segurança)
      if (globalLongPressTimerRef.current) {
        clearTimeout(globalLongPressTimerRef.current);
      }

      console.log("ScanningContext: Global press detectado durante varredura. Iniciando timer para parar...");

      // Inicia o timer para chamar stopScanning
      globalLongPressTimerRef.current = setTimeout(() => {
        console.log(`ScanningContext: Global long press (${GLOBAL_LONG_PRESS_DELAY}ms) concluído. Parando varredura.`);
        stopScanning(); // Chama a função para parar
      }, GLOBAL_LONG_PRESS_DELAY);
    };

    // Handler para limpar o timer se soltar antes
    const handleGlobalPressEnd = () => {
      if (globalLongPressTimerRef.current) {
        console.log("ScanningContext: Global press liberado antes do timeout. Cancelando parada.");
        clearTimeout(globalLongPressTimerRef.current);
        globalLongPressTimerRef.current = null;
      }
    };

    // Adiciona listeners ao documento
    document.addEventListener('mousedown', handleGlobalPressStart);
    document.addEventListener('touchstart', handleGlobalPressStart, { passive: true }); // passive: true pode melhorar performance no mobile

    document.addEventListener('mouseup', handleGlobalPressEnd);
    document.addEventListener('mouseleave', handleGlobalPressEnd); // Para se o mouse sair da janela
    document.addEventListener('touchend', handleGlobalPressEnd);
    document.addEventListener('touchcancel', handleGlobalPressEnd);

    // Função de limpeza para remover listeners
    return () => {
      document.removeEventListener('mousedown', handleGlobalPressStart);
      document.removeEventListener('touchstart', handleGlobalPressStart);

      document.removeEventListener('mouseup', handleGlobalPressEnd);
      document.removeEventListener('mouseleave', handleGlobalPressEnd);
      document.removeEventListener('touchend', handleGlobalPressEnd);
      document.removeEventListener('touchcancel', handleGlobalPressEnd);

      // Limpa o timer na desmontagem ou re-execução do efeito
      if (globalLongPressTimerRef.current) {
        clearTimeout(globalLongPressTimerRef.current);
        globalLongPressTimerRef.current = null;
      }
    };
    // Dependências: precisamos recriar os listeners se isScanning ou stopScanning mudar
    // para que o handler handleGlobalPressStart tenha o valor correto de isScanning
    // e a chamada correta a stopScanning.
  }, [isScanning, stopScanning]);


  const value = {
    isScanning,
    scanIndex,
    scanSpeed,
    setScanSpeed,
    registerScannableElements, // <-- Exporta a função de registro
    clearScannableElements,    // <-- Exporta a função de limpeza
    startScanning,             // <-- Função para iniciar (sem args)
    stopScanning,              // <-- Função para parar
  };

  return (
    <ScanningContext.Provider value={value}>
      {children}
    </ScanningContext.Provider>
  );
}

export function useScanning() {
  const context = useContext(ScanningContext);
  if (context === undefined) {
    throw new Error('useScanning must be used within a ScanningContextProvider');
  }
  return context;
}