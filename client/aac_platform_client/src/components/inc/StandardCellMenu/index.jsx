import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import Input from '../Input';
import Symbol from '../Symbol';
import SearchButton from '../SearchButton';
import {
  StandardCellMenuContainer,
  SearchField,
  StandardCells,
  CellItem
} from './styled';
import { useCell } from '../../contexts/CellContext';
import CellText from '../CellText';

function StandardCellMenu() {
  const {configCell, setConfigCell} = useCell();
  const [keyText, setKeyText] = useState("");
  const [foundCells, setFoundCells] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  function handleKeyTextChange(e) {
    setKeyText(e.target.value);
  }

  async function handleSearchClick() {
    if(!keyText.trim()) return;

    setFoundCells([]); // Limpa resultados anteriores
    setFeedbackMessage(""); // Limpa feedback anterior

    try {
      const response = await axios.get(`http://localhost:5000/cell/getByText/${keyText}`);
      setFoundCells(response.data);
      if (response.data.length === 0) {
        setFeedbackMessage("Nenhuma célula encontrada com este texto.");
    }
    } catch(error) {
      console.error("Error searching for cells:", error); // Log completo do erro é útil

      // Verifica se o erro é uma resposta do servidor (não um erro de rede, etc.)
      if (error.response) {
        // ***** VERIFICA O STATUS 404 *****
        if (error.response.status === 404) {
          setFoundCells([]); // Garante que a lista está vazia
          setFeedbackMessage("Nenhuma célula encontrada com este texto."); // Mensagem específica
        } else {
          // Outro erro do servidor (500, 400, etc.)
          setFoundCells([]);
          setFeedbackMessage(`Erro ao buscar: ${error.response.data?.message || 'Erro no servidor.'}`); // Tenta usar a mensagem do backend ou uma genérica
        }
      } else if (error.request) {
        // A requisição foi feita, mas não houve resposta (problema de rede/servidor offline)
        setFoundCells([]);
        setFeedbackMessage("Não foi possível conectar ao servidor. Verifique sua conexão.");
      } else {
        // Erro ao configurar a requisição
        setFoundCells([]);
        setFeedbackMessage("Ocorreu um erro inesperado ao preparar a busca.");
      }
    }
  }

  function handleCellClick(clickedCell) {
    console.log("Célula escolhida (StandardCellMenu): ", clickedCell);
    setConfigCell({ ...configCell, ...clickedCell });
  }

  return (
    <StandardCellMenuContainer>
      <SearchField>
        <Input 
          text={keyText} 
          handleTextChange={handleKeyTextChange} 
          type="text"  
          label="Buscar célula:"
        />
        <SearchButton handleSearchClick={handleSearchClick} />
      </SearchField>
      <StandardCells>
          {foundCells.map((cell, index) => {
            return (
              <CellItem
                key={index}
                $currentCell={configCell._id === cell._id}
                onClick={() => handleCellClick(cell)}
              >
                <Symbol source={`${cell.img}`}/>
                <CellText text={cell.text} fontSize="10px"/>
              </CellItem>
            );
          })}
          {feedbackMessage && (
            <p style={{ textAlign: 'center', color: '#dc3545', width: '100%', marginTop: '10px' }}>
              {feedbackMessage}
            </p>
          )}
        </StandardCells>
    </StandardCellMenuContainer>
  );
}

export default StandardCellMenu;