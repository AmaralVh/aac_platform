import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useCell } from "../../contexts/CellContext";
import SideBarButton from "../SideBarButton";
import {
  SideBarContainer,
  NavContainer,
  NavList,
  Item,
  ToggleButton 
} from "./styled";
import { useUser } from "../../contexts/UserContext";
import { useSidebar } from "../../contexts/SideBarContext";


const HamburgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CloseIcon = () => (
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
   <path d="M18 6L6 18M6 6L18 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
);


function SideBar() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const {editing, setEditing} = useCell();
  const {token} = useUser();

  const location = useLocation();

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const isSwiping = useRef(false);

  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
  if (!isSidebarOpen) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isSidebarOpen || !touchStartX.current) return; // Usa estado do contexto
    touchEndX.current = e.targetTouches[0].clientX;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSidebarOpen || !touchStartX.current || !touchEndX.current || !isSwiping.current) { // Usa estado do contexto
      touchStartX.current = null;
      touchEndX.current = null;
      isSwiping.current = false;
      return;
    }
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    if (isLeftSwipe) {
      toggleSidebar(); // Usa função do contexto
    }
    touchStartX.current = null;
    touchEndX.current = null;
    isSwiping.current = false;
  };

  const handleItemClick = (e, originalOnClick) => {
    if (isSwiping.current) {
      e.preventDefault();
      e.stopPropagation();
    } else if (originalOnClick) {
      originalOnClick();
    }
  };

  const loggedInOnlyItems = [
    <Item key="cur-board" onClick={(e) => handleItemClick(e)}>
        <SideBarButton to="/cur-board" text="Prancha atual" height="100%" fontSize="1vw" activeButton={location.pathname} />
    </Item>,
    <Item key="edit" onClick={(e) => handleItemClick(e, () => setEditing(!editing))}>
        <SideBarButton text="Editar" height="100%" fontSize="1vw" editing={editing} setEditing={setEditing} activeButton={location.pathname} isToggleButton />
    </Item>,
    <Item key="library" onClick={(e) => handleItemClick(e)}>
        <SideBarButton to="/library" text="Biblioteca de Pranchas" height="100%" fontSize="1vw" activeButton={location.pathname} />
    </Item>,
    <Item key="settings" onClick={(e) => handleItemClick(e)}>
        <SideBarButton text="Configurações" height="100%" fontSize="1vw" activeButton={location.pathname} />
    </Item>,
  ];

  return (
    <>
      <SideBarContainer
        $isOpen={isSidebarOpen} 
        onTouchStart={handleTouchStart} 
        onTouchMove={handleTouchMove}   
        onTouchEnd={handleTouchEnd} 
      >
        <NavContainer>
          <NavList>
          <Item key="logo" onClick={(e) => handleItemClick(e)}>
            <SideBarButton text="Logo e Marca" height="125%" width="86%" fontSize="1vw" activeButton={location.pathname} />
          </Item>
            {token && loggedInOnlyItems}
            <Item key="account" onClick={(e) => handleItemClick(e)}>
              <SideBarButton to="/account" text="Contas e usuários" height="100%" fontSize="1vw" activeButton={location.pathname} />
            </Item>
            <Item key="about" onClick={(e) => handleItemClick(e)}>
              <SideBarButton text="Sobre a plataforma" height="100%" fontSize="1vw" activeButton={location.pathname} />
            </Item>
          </NavList>
        </NavContainer>
      </SideBarContainer>
      <ToggleButton onClick={toggleSidebar} $isOpen={isSidebarOpen} aria-label={isSidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"} aria-expanded={isSidebarOpen}>
        {isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
      </ToggleButton>
    </>
  );
}

export default SideBar;