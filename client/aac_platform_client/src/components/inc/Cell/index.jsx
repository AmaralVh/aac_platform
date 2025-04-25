import { useCallback, useState, forwardRef } from "react";
import CellText from "../CellText";
import Symbol from "../Symbol";
import {
  CellContainer
} from "./styled";
import { useCell } from "../../contexts/CellContext";
import { usePhrase } from "../../contexts/PhraseContext";
import useLongPress from "../../hooks/useLongPress";
import { useBoard } from "../../contexts/BoardContext";
import api from "../../../services/api";
import { useScanning } from "../../contexts/ScanningContext";


const Cell = forwardRef(({ index, cell, setTargetIndex, targetIndex, onDrop, bounceCells, ...props }, ref) => {
  const {editing, setActiveCell, configCell, setConfigCell} = useCell();
  const {addWord} = usePhrase();
  const {board, setBoard, categorizedBoards, boardStack, setBoardStack} = useBoard();
  const {isScanning} = useScanning();
  const [isDragging, setIsDragging] = useState(false);

  const handleLongPress = useCallback(async () => {
    if (!editing && !isScanning) {
      console.log("Long press na célula:", cell?.text);

      // Pega as categorias da célula e as tags do board com segurança
      const cellCategories = cell?.categories;
      const currentBoardTags = board?.tags;

      // Verifica se ambos são arrays válidos para proceder
      if (Array.isArray(cellCategories) && Array.isArray(currentBoardTags)) {
        console.log("Categorias da Célula:", cellCategories);
        console.log("Tags do Board Atual:", currentBoardTags);

        // Encontra a PRIMEIRA categoria da célula que NÃO está nas tags do board
        const nextRelevantCategory = cellCategories.find(
          cellCat => !currentBoardTags.includes(cellCat)
        );

        // Se encontrou uma categoria relevante...
        if (nextRelevantCategory !== undefined) {
          console.log("Próxima categoria relevante encontrada:", nextRelevantCategory);
          // Verifica se temos os boards categorizados e a lista para a categoria relevante
          if (categorizedBoards &&
            categorizedBoards[nextRelevantCategory] &&
            Array.isArray(categorizedBoards[nextRelevantCategory]) &&
            categorizedBoards[nextRelevantCategory].length > 0) {
            // Pega o PRIMEIRO board da lista correspondente a essa categoria
            const targetBoard = categorizedBoards[nextRelevantCategory][0];
            
            const response = await api.get(`/board/getById/${targetBoard._id}`); 
            const newBoardStack = boardStack;
            newBoardStack.push(board);
            setBoardStack(newBoardStack);
            const populatedBoard = response.data;
            setBoard(populatedBoard);
          } else {
            // Log se não encontrar boards para a categoria específica
            console.warn(`Nenhum board encontrado ou lista vazia para a categoria '${nextRelevantCategory}' em categorizedBoards.`);
          }
        } else {
          // Se o find não encontrou nada (ou cellCategories estava vazio)
          console.log("Nenhuma categoria relevante encontrada (ou todas as categorias da célula são tags do board atual).");
        }
      } else {
        // Se os dados não forem válidos (ex: célula sem 'categories' ou board sem 'tags')
        console.warn("Não foi possível processar categorias/tags. Verifique os dados da célula e do board.");
        if (!Array.isArray(cellCategories)) console.warn("cell.categories não é um array:", cellCategories);
        if (!Array.isArray(currentBoardTags)) console.warn("board.tags não é um array:", currentBoardTags);
      }
    }
  }, [editing]);

  const longPressHandlers = useLongPress(handleLongPress, { delay: 1000 });




  function handleCellClick(event) {
    if (isScanning && event && event.isTrusted) {
      return; // IGNORA o clique direto do usuário durante a varredura
    }

    if(editing) {
      if(!configCell) {
        setConfigCell({ ...cell, indexOnBoard: index });
      }
    } else {
      addWord(cell.text);
    }
  }

  function handleContextMenu(e) {
    e.preventDefault();
  }

  return (
    <CellContainer 
      ref={ref}
      {...(!editing ? longPressHandlers : {})}
      draggable={editing}
      $editing={editing}
      $isDragging={isDragging}
      $isTarget={targetIndex === index}
      $isBouncing={bounceCells !== null && bounceCells.includes(index)}
      onClick={handleCellClick}
      onContextMenu={handleContextMenu} 
      onDragStart={(e) => {
        e.stopPropagation();
        setActiveCell(index);
        setIsDragging(true);
      }} 
      onDragEnd={() => {
        setActiveCell(null);
        setIsDragging(false);
        setTargetIndex(null);
      }}
      onDrop={() => {
        onDrop();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setTargetIndex(index);
      }}
      color={cell.color}
    >
      <Symbol source={cell.img} />
      <CellText text={cell.text} />
    </CellContainer>
  );
});

export default Cell;