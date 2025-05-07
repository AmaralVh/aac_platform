import styled from "styled-components";
import { NavLink as Link } from 'react-router-dom';

export const ButtonContainer = styled(Link)`
  width: ${({$width}) => ($width ? $width : "100%")};
  height: ${({$height}) => ($height ? $height : "100%")};
  background-color: ${({$activeButton}) => (($activeButton) ? "#003466" : "white")};
  padding: ${({$padding}) => ($padding ? $padding : "0")};
  border: none;
  display:flex;
  align-items: center;
  justify-content: center;
  font-size: ${({$fontSize}) => ($fontSize ? $fontSize : "1.2vw")};
  color: ${({$activeButton}) => ($activeButton ? "white" : "black")};
  text-decoration: none;

  &:hover {
    cursor: pointer;
    background-color: ${({$activeButton}) => ($activeButton ? "#003466" : "#EEEEEE")};
    color: ${({$activeButton}) => ($activeButton ? "white" : "black")};
  }

  ${({ $isEditing }) =>
    $isEditing &&
    `
      filter: drop-shadow(0 1px 4px #525252);
      background-color: #EEEEEE;
    `
  }

  ${({ $activeButton }) =>
    $activeButton &&
    `
      filter: drop-shadow(0 1px 4px #525252);
    `
  }
`;