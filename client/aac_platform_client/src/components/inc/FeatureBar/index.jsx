import Button from "../Button";
import WriteBar from "../WriteBar";
import { usePhrase } from "../../contexts/PhraseContext";
import api from "../../../services/api";

import {
  FeatBarContainer,
  DivBack,
  BoardName,
  DivKeyboard,
} from "./styled";
import { useCell } from "../../contexts/CellContext";
import { useBoard } from "../../contexts/BoardContext";


function FeatureBar() {
  const {clearPhrase, deleteWord, speech } = usePhrase();
  const {editing} = useCell();
  const {setConfigBoard, board, setBoard, boardStack, setBoardStack} = useBoard();

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

  return (
    <FeatBarContainer $editing={editing}>
      <DivBack>
        <Button onClick={boardBack} text="Voltar" height="50%" width="5vw"/>
      </DivBack>
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
    </FeatBarContainer>
  );
}

export default FeatureBar;