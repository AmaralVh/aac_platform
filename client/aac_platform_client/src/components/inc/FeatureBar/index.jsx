import Button from "../Button";
import WriteBar from "../WriteBar";
import { usePhrase } from "../../contexts/PhraseContext";
import api from "../../../services/api";
import { useCallback } from "react";

import {
  FeatBarContainer,
  DivBack,
  BoardName,
  DivKeyboard,
} from "./styled";
import { useCell } from "../../contexts/CellContext";
import { useBoard } from "../../contexts/BoardContext";
import { useScanning } from "../../contexts/ScanningContext";


function FeatureBar() {
  const {clearPhrase, deleteWord, speech } = usePhrase();
  const {editing} = useCell();
  const {setConfigBoard, board, setBoard, boardStack, setBoardStack} = useBoard();
  const {isScanning, stopScanning, startScanning} = useScanning();

  function openConfigBoard() {
    setConfigBoard(true);
  }

  async function boardBack() {
    if(boardStack.length >= 1) {
      let newBoardStack = boardStack;
      const newBoard = newBoardStack.pop();
      setBoardStack(newBoardStack);
      
      const response = await api.get(`/board/getById/${newBoard._id}`);
      const populatedBoard = response.data;
      setBoard(populatedBoard);
    }
  }


  function scanningControl() {
    if(isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  }

  return (
    <FeatBarContainer $editing={editing}>
      {
        boardStack.length >= 1 &&
        <DivBack>
          <Button onClick={boardBack} text="Voltar" height="50%" width="5vw"/>
        </DivBack>
      }
      
      <BoardName>{board?.name}</BoardName>
      <DivKeyboard>
        <Button onClick={speech} text="Falar" height="50%" width="5vw"/>
        <WriteBar/>
        <Button onClick={deleteWord} text="Apagar" height="50%" width="5vw"/>
        <Button onClick={clearPhrase} text="Limpar" height="50%" width="5vw"/>
      </DivKeyboard>
      {
        editing &&
        <Button onClick={openConfigBoard} text="Editar prancha" height="50%" width="9vw"/>
      }
      {
        !editing &&
        <Button onClick={scanningControl} text={isScanning ? 'Desativar Varredura' : 'Ativar Varredura'} height="50%" width="11vw"/>
      }
    </FeatBarContainer>
  );
}

export default FeatureBar;