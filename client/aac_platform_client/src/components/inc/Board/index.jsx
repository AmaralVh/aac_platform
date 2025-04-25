import { useState, useEffect, useRef, useCallback, createRef } from "react";
import { useCell } from "../../contexts/CellContext";
import Cell from "../Cell";
import BoardPreview from '../PageLibrary/BoardPreview';
import {
  BoardContainer,
  BoardItem
} from "./styled";
import { useBoard } from "../../contexts/BoardContext";
import api from "../../../services/api";
import CellPreview from "../CellPreview";
import { useScanning } from "../../contexts/ScanningContext";


function Board() {
  const {activeCell, setActiveCell, editing, configCell} = useCell();
  const {board, setBoard, configBoard, fetchCategorizedBoards, boardStack} = useBoard();
  const [targetIndex, setTargetIndex] = useState(null);
  const [dimensions, setDimensions] = useState(board ? [board.dimensions[0], board.dimensions[1]] : [4, 6]);
  const [bounceCells, setBounceCells] = useState( null );
  const [hasBoardChanges, setHasBoardChanges] = useState(false);
  const prevConfigCellRef = useRef(configCell);
  const prevConfigBoardRef = useRef(configBoard);
  const { registerScannableElements, clearScannableElements } = useScanning();

  // Gerencia refs APENAS para as células
  const cellRefs = useRef([]);

  // Garante que temos o número certo de refs para as células
  const numCells = board?.numCells || 0;
  useEffect(() => {
    if (cellRefs.current.length !== numCells) {
      // Cria/mantém refs existentes, adiciona novas se necessário
      cellRefs.current = Array(numCells).fill().map(
        (_, i) => cellRefs.current[i] || createRef()
      );
    }
     // Remove refs extras se numCells diminuiu
     if (cellRefs.current.length > numCells) {
        cellRefs.current.length = numCells;
    }
  }, [numCells]);

  // useEffect para REGISTRAR as refs no contexto quando elas mudarem
  useEffect(() => {
    // Filtra apenas as refs válidas (que têm um .current)
    const validCellRefs = cellRefs.current.filter(ref => ref?.current);

    if (validCellRefs.length > 0) {
      // Registra as refs válidas no contexto
      registerScannableElements(validCellRefs);
    } else {
       // Se não há refs válidas (ex: board vazio), informa o contexto
       registerScannableElements([]); // Ou use clearScannableElements() se preferir
    }

    // Função de limpeza: Limpa os elementos registrados quando o Board desmontar
    // ou quando a lista de células válidas mudar significativamente (ex: ficar vazia)
    return () => {
      clearScannableElements();
    };
    // Dependências: Roda quando o array de refs mudar (após a atualização do DOM)
    // ou quando as funções do contexto mudarem (pouco provável, mas seguro incluir)
  }, [board, numCells, registerScannableElements, clearScannableElements]); // Depender de numCells garante que roda após as refs serem ajustadas

  const baseURL = import.meta.env.VITE_API_BASE_URL

  const prevEditingRef = useRef(editing);

  async function updateImgPreview() {
    if(!board || !board._id) return;
    try {
      const cell0Id = board.cells[0]._id;
      const response = await api.get(`/cell/get/${cell0Id}`);
      const cell0Complete = response.data;
      console.log(cell0Complete);
      const cell0Img = cell0Complete.img;
      console.log(cell0Img);
      const newBoard = {...board, imgPreview: cell0Img};
      setBoard(newBoard);

      return {...board, imgPreview: cell0Img};
    } catch(error) {
      console.log('Error sending cells to api:', error);
    }
  }

  async function updateBoard(boardToSave) {
    if(!boardToSave || !boardToSave._id) return;
    try {
      console.log("Imagem do board antes do patch: ", boardToSave.imgPreview);
      await api.patch(`/board/patch/${board._id}`, boardToSave);
      console.log('Cells successfully sent to api');
    } catch(error) {
      console.log('Error sending cells to api:', error);
    }
  }

  const onDrop = (targetPosition) => {
    if(activeCell == null || activeCell === undefined) return;

    // Switch cell positions:
    const newCells = [...board.cells];
    const currentCell = newCells[activeCell];
    const targetCell = newCells[targetPosition];

    newCells[targetPosition] = currentCell;
    newCells[activeCell] = targetCell;

    setBoard({
      _id: board._id,
      name: board.name,
      numCells: board.numCells,
      cells: newCells,
      dimensions: board.dimensions,
      type: board.type,
      userId: board.userId,
      tags: board.tags,
      imgPreview: board.imgPreview
    })
    setBounceCells([activeCell, targetPosition]);
    setTimeout(() => {
      setBounceCells([]); 
    }, 300); 
    setTargetIndex(null);
    setHasBoardChanges(true);
  }

  // Update board after configCell menu:
  useEffect(() => {
    // Use a ref to track the previous value
    const prevConfigCell = prevConfigCellRef.current; // (Necessário adicionar este ref, veja abaixo)

    // Only act if configCell changed FROM something TO null
    if (prevConfigCell !== null && configCell === null) {
      console.log("Após sair da configuração da célula => Marcando que houve mudanças");
      // Instead of saving immediately, just mark that changes happened
      setHasBoardChanges(true);
      // The existing useEffect that monitors 'editing' will handle the save
      // when the user exits editing mode.
    }

    // Update the ref for the next render
    prevConfigCellRef.current = configCell;
  }, [configCell]);

  // Update board after configBoard menu:
  useEffect(() => {
    // Use a ref to track the previous value
    const prevConfigBoard = prevConfigBoardRef.current; 

    // Only act if configBoard changed FROM something TO false
    if (prevConfigBoard !== false && configBoard === false) {
      console.log("Após sair da configuração do board => Marcando que houve mudanças");
      // Instead of saving immediately, just mark that changes happened
      setHasBoardChanges(true);
    }

    // Update the ref for the next render
    prevConfigBoardRef.current = configBoard;
  }, [configBoard]);

  useEffect(() => {
    const prevEditing = prevEditingRef.current;

    async function handleSave() {
      // If 'editing' changes from true to false:
      if(prevEditing && !editing && hasBoardChanges) {
        console.log("Após sair do modo edição => UpdateBoard");
        const updatedBoard = await updateImgPreview();
        await updateBoard(updatedBoard);
        fetchCategorizedBoards();
        setHasBoardChanges(false);
      }
    }
    
    handleSave();

    prevEditingRef.current = editing;
  }, [editing]);

  useEffect(() => {
    if(board && board.dimensions){
      setDimensions(board.dimensions);
    }
  }, [board]);

  useEffect(() => {
    fetchCategorizedBoards();
  }, [])

  if(!board || board === undefined) {
    return (
      <h2>Carregando...</h2>
    );
  } 

  console.log("Board stack: ", boardStack);

  return (
    <BoardContainer $dimensions={dimensions}>
      {Array.from({ length: board.numCells }).map((_, index) => {
        // Verifica se existe uma célula definida no array 'board.cells' para este índice:
        const cellData = board.cells && board.cells[index];
        // Pega a ref correta para a célula:
        const cellRef = cellRefs.current[index];

        return (
          <BoardItem key={index}>
            {
              // Se cellData existe e não é null/undefined (ou qualquer valor que signifique 'vazio')
              cellData ?
              <Cell
                ref={cellRef} // Passa a ref individual para a Cel
                index={index}
                cell={cellData} // Passa a célula encontrada
                setTargetIndex={setTargetIndex}
                targetIndex={targetIndex}
                onDrop={() => onDrop(index)}
                bounceCells={bounceCells}
              />
              :
              // Caso contrário, renderiza o placeholder BoardPreview
              <CellPreview index={index}/>
            }
          </BoardItem>
        );
      })}
    </BoardContainer>
  );
}

export default Board;