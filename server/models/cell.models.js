import mongoose from 'mongoose';

const cellSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    unique: true
  },
  img: {
    type: String
  },
  color: {
    type: String
  }
}, { versionKey: false });

const Cell = mongoose.model("cell", cellSchema);

export default Cell;