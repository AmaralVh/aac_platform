import Input from '../../Input';
import api from '../../../../services/api';
import {
  LoginFormContainer,
  EnterButton,
  ForgotPassword
} from './styled';
import { useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const {signInUser} = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState(null); 

  const navigate = useNavigate();

  async function handleEnterButton(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try { 
      const loginData = {
        email,
        password
      }

      const success = await signInUser(loginData);

      if(success) {
        console.log("Login successfully done");
        navigate('/cur-board');
      }
      
      setEmail("");
      setPassword("");
    } catch(error) {
      console.log("Error submiting login form: ", error);
      const errorMessage = error.response?.data?.message || error.message || "Falha no login. Verifique suas credenciais.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return(
    <LoginFormContainer>
      <Input type="email" label="E-mail" text={email} handleTextChange={(e) => setEmail(e.target.value)} width="50%" required autocomplete="username" disabled={isSubmitting}/>
      <Input type="password" label="Senha" text={password} handleTextChange={(e) => setPassword(e.target.value)} width="50%" required autocomplete="current-password" disabled={isSubmitting}/>
      {error && <p style={{ color: 'red', width: '50%', textAlign: 'center', marginTop: '10px' }}>{error}</p>}
      <EnterButton onClick={handleEnterButton} $height="8%" $width="14%" $fontSize="1vw" >Entrar</EnterButton>
      <ForgotPassword>Esqueci a senha</ForgotPassword>
    </LoginFormContainer>
  );
}

export default LoginForm;