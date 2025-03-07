import {
  InputContainer,
  Label,
  InputField
} from './styled';

function Input({ text, handleTextChange, type, label, width }) {
  return (
    <InputContainer $width={width}>
      <Label>{label}</Label>
      <InputField
        value={text}
        onChange={handleTextChange}
        type={type}
      ></InputField>
    </InputContainer>
  );
}

export default Input;