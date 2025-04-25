import styled from "styled-components";

export const FeatBarContainer = styled.div`
  width: 100%;
  height: 12vh;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  filter: drop-shadow(0 4px 8px grey);
  box-sizing: border-box;
  z-index: 4;
  padding: 0 4vw 0 4vw;
    
`;

export const DivBack = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  margin: 0;
`;

export const BoardName = styled.h1`
  font-size: 1.5vw;
  font-weight: 400;
`;

export const DivKeyboard = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  margin: 0;
  gap: 1.5vw;
`;