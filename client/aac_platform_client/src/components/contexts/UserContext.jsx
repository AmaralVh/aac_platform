import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import { jwtDecode } from 'jwt-decode';

const UserContext = createContext();

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        // Decode token to get user info (basic validation)
        // For real security, you might want to verify the token signature
        // or make a quick API call to validate it on the backend if needed.
        const decodedUser = jwtDecode(storedToken); // Make sure token has user details

        // Optional: Check token expiration
        const currentTime = Date.now() / 1000;
        if (decodedUser.exp < currentTime) {
          console.log("Token expired");
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        } else {
          console.log("Restoring session from localStorage");
          setToken(storedToken);
          // Extract user details from the decoded token (adjust based on your token payload)
          setUser({
             _id: decodedUser._id,
             name: decodedUser.name,
             email: decodedUser.email,
             type: decodedUser.type,
             currentBoard: decodedUser.currentBoard // Assuming these are in the token
          });
          // Also configure your api instance to use this token by default
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error("Error decoding token from localStorage:", error);
        localStorage.removeItem('authToken'); // Remove invalid token
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false); // Finished initial check
  }, []);

  const signUpUser = useCallback(async (newUser) => {
    if(!newUser) {
      console.warn("signUpUser called without an user.");
      return; 
    }

    try {
      const defaultBoardName = "Padrão 1";
      let defaultBoardId = null;

      try {
        console.log(`Attempting to fetch board ID for: ${defaultBoardName}`);
        const boardResponse = await api.get(`/board/get/${defaultBoardName}`);

        console.log(boardResponse.data);

        if (boardResponse.data && boardResponse.data._id) {
          defaultBoardId = boardResponse.data._id;
          console.log(`Successfully fetched board ID: ${defaultBoardId}`);
        } else {
          throw new Error(`Board "${defaultBoardName}" found but ID is missing.`);
        }
      } catch (boardError) {
        console.error(`Failed to fetch default board "${defaultBoardName}":`, boardError.response?.data?.message || boardError.message);
        throw new Error(`Could not find the required default board "${defaultBoardName}". Signup aborted.`);
      }

      const userDataToSend = {
        ...newUser, 
        currentBoard: defaultBoardId 
      };

      await api.post(`/user/post`, userDataToSend); 
    } catch (err) {
      console.error("UserContext: Error during sign up process:", err.response?.data || err.message || err);
      setUser(null); 
      throw err;
    }
  }, []);

  // Login function:
  const signInUser = useCallback(async (loginData) => {
    try {
      const response = await api.post('/user/login', loginData); // Use your actual API endpoint

      const { token: receivedToken, message } = response.data; // Get token from response

      if (receivedToken) {
        const decodedUser = jwtDecode(receivedToken); // Decode to get user info

        localStorage.setItem('authToken', receivedToken); // *** STORE TOKEN ***
        setToken(receivedToken);
        setUser({
            _id: decodedUser._id,
            name: decodedUser.name,
            email: decodedUser.email,
            type: decodedUser.type,
            currentBoard: decodedUser.currentBoard
         });
        // Set default header for subsequent API calls in this session
        api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
        console.log(message || "Login successful");
        return true;
      } else {
         // Handle case where backend sends 200 but no token (shouldn't happen with your code)
         throw new Error("Login successful but no token received.");
      }

    } catch (error) {
      console.error("Error during sign in:", error);
      // Clear any potentially stale auth state
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      // Re-throw the error so the LoginForm component can catch it and display message
      throw error;
    }
  }, []);

  // Logout function
  const signOutUser = () => {
    console.log("Signing out");
    localStorage.removeItem('authToken'); // *** REMOVE TOKEN ***
    setToken(null);
    setUser(null);
    // Remove default header
    delete api.defaults.headers.common['Authorization'];
    // Optional: Redirect to login page or home page
    // window.location.href = '/login';
  };

  const updateCurrentBoard = async (newCurrentBoard) => {
    // 1. Validar entradas
    if (!newCurrentBoard?._id) { // Verifica se newCurrentBoard e seu _id existem
      console.warn("updateCurrentBoard chamado sem um newCurrentBoard válido com _id.");
      return;
    }
    if (!user?._id) { // Verifica se user e seu _id existem
      console.warn("updateCurrentBoard chamado quando o usuário não está carregado ou não tem _id.");
      return;
    }

    const newBoardId = newCurrentBoard._id;
    const userId = user._id;

    // 2. Criar o payload CORRETO para a API (apenas o campo a ser mudado)
    const updatePayload = {
      currentBoard: newBoardId
    };

    // 3. (Opcional, mas bom para UI rápida) Atualizar estado local IMEDIATAMENTE com um NOVO objeto
    //    Isso faz a UI refletir a mudança antes da confirmação da API.
    const updatedUserObject = {
        ...user, // Copia todas as propriedades existentes do usuário
        currentBoard: newBoardId // Sobrescreve apenas o currentBoard
    };
    setUser(updatedUserObject); // Passa um NOVO objeto para setUser

    try {
      // 4. Chamar a API com o payload correto e a rota correta (ajuste se necessário)
      //    ASSUMINDO que o backend retorna { message: string, token: string } com um NOVO token
      const response = await api.patch(`/user/update/${userId}`, updatePayload); // Rota /users/:id como no exemplo anterior

      console.log("Current board update successful on backend:", response.data.message);

      // 5. ATUALIZAR O TOKEN se o backend retornar um novo
      if (response.data && response.data.token) {
          const receivedToken = response.data.token;
          const decodedUser = jwtDecode(receivedToken); // Decodifica novo token

          localStorage.setItem('authToken', receivedToken); // Salva NOVO token
          setToken(receivedToken); // Atualiza estado do token

          // Re-sincroniza o estado do usuário com base no NOVO token (garante consistência total)
           setUser({
              _id: decodedUser._id,
              name: decodedUser.name,
              email: decodedUser.email,
              type: decodedUser.type,
              currentBoard: decodedUser.currentBoard // Agora está atualizado pelo novo token
           });
           // Define o header default com o novo token
           api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

      } else {
         // Se o backend não retornou um novo token, o estado local já foi atualizado
         // no passo 3, mas a persistência ao recarregar não funcionará até o próximo login.
         console.warn("Backend did not return a new token after update. Refresh might revert currentBoard.");
      }

    } catch (error) {
      console.error("Error updating current board on backend:", error.response?.data || error.message);
    }
  }

  return (
    <UserContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token,
      loading,
      signUpUser,
      signInUser,
      signOutUser,
      updateCurrentBoard
    }}>
      {!loading && children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if(context === undefined) {
    throw new Error('useUSer must be used within a UserProvider');
  }
  return context;
}