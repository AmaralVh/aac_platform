import Cell from '../models/cell.models.js';

export async function postCell(req, res) {
  try {
    // Instanciate an cell object:  
    const newCell = new Cell({
      text: req.body.text,
      img: req.body.img,
      color: req.body.color,
      categories: req.body.categories
    });

    // Checking existing cell text:
    const existingCell = await Cell.findOne({ img: newCell.img });
    if(existingCell) {
      return res.status(400).send({message: "The cell img is already in use"});
    }

    // Store into the database:
    await newCell.save();

    res.status(201);
    res.send({message: "Cell successfuly created"});
  } catch(error) {
    res.status(500);
    res.send(error.message);
  }
}

export async function getAllCells(req, res) {
  try {
    const cells = await Cell.find({});

    res.status(200);
    res.send(cells);
  } catch(error) {
    res.status(500);
    res.send(error.message);
  }
}

export async function getCellById(req, res) {
  try {
    const cellId = req.params.id;

    const foundCell = await Cell.findById(cellId);

    if(!foundCell) {
      return res.status(404).send({ message: "Cell not found" });
    }

    res.status(200);
    res.send(foundCell);
  } catch(error) {
    res.status(500);
    res.send(error.message);
  }
}

export async function getCellsByText(req, res) {
  try {
    const keyText = req.params.text;

    const foundCells = await Cell.find({ text: { $regex: keyText, $options: "i" } });

    if(foundCells.length === 0) {
      return res.status(404).send({ message: "Cells not found by text: ", foundCells });
    }

    res.status(200).send(foundCells);
  } catch(error) {
    res.status(500).send(error.message);
  }
}

export async function updateCellById(req, res) {
  try {
    const cellId = req.params.id;
    const modifications = req.body;
    
    const modifiedCell = await Cell.findByIdAndUpdate(cellId, modifications);

    if(!modifiedCell) {
      return res.status(404).send({ message: "Cell not found" });
    }

    res.status(200);
    res.send("Cell successfully modified");
  } catch(error) {
    res.status(500);
    res.send(error.message);
  }
}

export async function updateManyCells(req, res) {
  try {
    const updates = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Invalid updates" });
    }

    await Cell.bulkWrite(updates);
    res.status(200).send("Many cells successfully updated");
  } catch(error) {
    res.status(500);
    res.send(error.message);
  }
}

export async function cellColorReport(req, res) {
  try {
    const distribution = await Cell.aggregate([
      {
        $group: {
          _id: '$color', 
          count: { $sum: 1 } 
        }
      },
      {
        $sort: { count: -1 } 
      }
    ]);

    res.status(200).json({
      message: "Color distribution successfully generated",
      distribution
    });
  } catch (error) {
    console.error("Error generating color report:", error);
    res.status(500).json({ message: "Error generating color report" });
  }
}

export async function deleteCellById(req, res) {
  try {
    const deletedCell = await Cell.findByIdAndDelete(req.params.id);

    if(!deletedCell) {
      return res.status(404).send({ message: "Cell not found" });
    }

    res.status(200);
    res.send("Cell successfully deleted");
  } catch(error) {
    res.status(404);
    res.send(error.message);
  }
}

export async function deleteAllCells(req, res) {
  try {
    const deletedCell = await Cell.deleteMany({})

    if(!deletedCell) {
      return res.status(404).send({ message: "Cell not found" });
    }

    res.status(200);
    res.send("Cells successfully deleted");
  } catch(error) {
    res.status(404);
    res.send(error.message);
  }
}