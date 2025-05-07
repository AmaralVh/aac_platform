import { createGlobalStyle } from "styled-components"; 
import styled from "styled-components";
import { CellContextProvider } from "./components/contexts/CellContext";
import { BrowserRouter } from "react-router-dom"
import Router from "./Routes";
import { PageContextProvider } from "./components/contexts/PageContext";
import { BoardContextProvider } from "./components/contexts/BoardContext";
import { UserContextProvider } from "./components/contexts/UserContext";
import { SidebarProvider } from "./components/contexts/SideBarContext";
import { ScanningContextProvider } from "./components/contexts/ScanningContext";
import { PhraseContextProvider } from "./components/contexts/PhraseContext";

const AppContainer = styled.div`
  height: 100%;
`;

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    height: 100vh;
    background-color: #EAEAEA;
  }
  
  #root {
    height: 100%;
  }

  .scanned-highlight {
    outline: 4px solid dodgerblue;
    outline-offset: 3px;
    box-shadow: 0 0 12px rgba(30, 144, 255, 0.8);
    transition: outline 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
`;

function App() {
  return (
    <AppContainer>
      <GlobalStyle/>
        <BrowserRouter>
          <PhraseContextProvider>
            <ScanningContextProvider>
              <SidebarProvider>
                <UserContextProvider>
                  <PageContextProvider>
                    <BoardContextProvider>
                      <CellContextProvider>
                        <Router/>
                      </CellContextProvider>
                    </BoardContextProvider>
                  </PageContextProvider>
                </UserContextProvider>
              </SidebarProvider>
            </ScanningContextProvider>
          </PhraseContextProvider>  
        </BrowserRouter>
    </AppContainer>
  );
}

export default App;