import styled from "styled-components";

export const ButtonContainer = styled.button`
  width: ${({$width}) => ($width ? $width : "100%")};
  height: ${({$height}) => ($height ? $height : "100%")};
  background-color: ${({$color}) => ($color ? $color : "#EEEEEE")};
  padding: ${({$padding}) => ($padding ? $padding : "0")};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({$fontSize}) => ($fontSize ? $fontSize : "1.2vw")};
  font-weight: ${({$fontWeight}) => ($fontWeight ? $fontWeight : "400")};
  border: 2px solid #525252;
  margin: ${({$margin}) => ($margin ? $margin : "0")};
  filter: drop-shadow(0 4px 3px gray);

  &:hover {
    cursor: pointer;
    filter: drop-shadow(0 4px 5px gray);
  }
`;