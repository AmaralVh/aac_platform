import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000'; // Base URL for API calls
const API_ENDPOINT_GET_ALL = `${API_BASE_URL}/cell/get`; // Endpoint to get all cells
const API_ENDPOINT_GET_ONE = `${API_BASE_URL}/cell/get`; // Endpoint to get one cell by ID (adjust if different)
const OUTPUT_JSON_FILE = 'basic_nees_board_with_text.json';
const BOARD_SIZE = 24;
const BOARD_NAME = 'Necessidades básicas';
const TARGET_CATEGORY = 'basic needs'; // This will also be used for the tag
const BOARD_TYPE = '0';
const USER_ID = '67d1ba27049c3eae90ec8c9e';
// ---------------------

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function createAnimalBoardWithTextFromAPI() {
    console.log(`--- Iniciando criação de quadro (${BOARD_SIZE} células) ---`);
    console.log(`--- Filtros: texto não vazio E categoria '${TARGET_CATEGORY}' ---`);
    console.log(`--- Buscando células da API: ${API_ENDPOINT_GET_ALL} ---`);
    const lowerTargetCategory = TARGET_CATEGORY.toLowerCase();

    // --- Configuration Validation ---
    if (!USER_ID || USER_ID === 'YOUR_USER_ID_HERE') {
        console.error("\nError: USER_ID não está configurado corretamente.");
        process.exit(1);
    }
    if (BOARD_TYPE !== '0' && BOARD_TYPE !== '1') {
        console.error("\nError: BOARD_TYPE inválido (deve ser '0' ou '1').");
        process.exit(1);
    }
    if (BOARD_SIZE <= 0) {
        console.error("\nError: BOARD_SIZE deve ser maior que zero.");
        process.exit(1);
    }
    // --- End Validation ---

    let liveCells;

    // 1. Fetch data from the API
    try {
        const response = await axios.get(API_ENDPOINT_GET_ALL);
        liveCells = response.data;
        if (!Array.isArray(liveCells)) {
            console.error("\nAPI Error: A resposta da API não é um array.");
            process.exit(1);
        }
        console.log(`API Success: ${liveCells.length} total cells found.`);

    } catch (error) {
        console.error(`\nAPI Error: Failed to fetch data from ${API_ENDPOINT_GET_ALL}`);
        if (error.response) {
            console.error(` -> Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            console.error(" -> No response received from server.");
        } else {
            console.error(` -> Error message: ${error.message}`);
        }
        process.exit(1);
    }

    // ---- DEBUGGING: Inspect sample cell data (Optional, keep if useful) ----
    // console.log("\n--- DEBUG: Inspecting first 15 cells from API ---");
    // ... (your debugging code here) ...
    // console.log("-------------------------------------------------\n");
    // ---- END DEBUGGING ----


    // 2. Filter cells: require _id, non-empty text, AND target category
    console.log(`Filtering cells: must have _id, non-empty text, AND category '${TARGET_CATEGORY}'...`);
    const validCellsForBoard = liveCells.filter(cell => {
        const textIsValid = cell && cell.text && String(cell.text).trim() !== '';
        const categoriesIsValid = Array.isArray(cell.categories) &&
                               cell.categories.some(category =>
                                   String(category).trim().toLowerCase() === lowerTargetCategory
                               );
        return cell && typeof cell._id !== 'undefined' && textIsValid && categoriesIsValid;
    });
    console.log(` -> ${validCellsForBoard.length} cells remaining after filtering.`);

    // 3. Check if enough valid cells are available
    if (validCellsForBoard.length < BOARD_SIZE) {
        console.error(`\nError: Not enough valid cells found (${validCellsForBoard.length}) matching all criteria to create a board of size ${BOARD_SIZE}.\n`);
        process.exit(1);
    }


    // 4. Shuffle
    console.log('Shuffling valid cells...');
    shuffleArray(validCellsForBoard);

    // 5. Select
    console.log(`Selecting the first ${BOARD_SIZE} shuffled cells...`);
    const selectedCells = validCellsForBoard.slice(0, BOARD_SIZE);

    // *** NEW STEP 5.5: Get image URL from the first selected cell ***
    let firstCellImageUrl = null; // Default value
    if (selectedCells.length > 0) {
        const firstCellId = selectedCells[0]._id;
        console.log(`Fetching details for the first cell (ID: ${firstCellId}) to get image preview...`);
        try {
            // Construct the endpoint for getting a single cell
            const singleCellEndpoint = `${API_ENDPOINT_GET_ONE}/${firstCellId}`;
            const cellResponse = await axios.get(singleCellEndpoint);

            if (cellResponse.data && cellResponse.data.img) {
                firstCellImageUrl = cellResponse.data.img;
                console.log(` -> Image preview URL found: ${firstCellImageUrl}`);
            } else {
                console.warn(` -> Warning: Could not find imageUrl for cell ID ${firstCellId}. 'imgPreview' will be null.`);
            }
        } catch (error) {
            console.error(`\nAPI Error: Failed to fetch details for cell ID ${firstCellId}`);
            if (error.response) {
                console.error(` -> Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
            } else {
                console.error(` -> Error message: ${error.message}`);
            }
            console.warn(" -> Proceeding without image preview.");
            // Continue without stopping the script, imgPreview will remain null
        }
    } else {
        console.warn(" -> Warning: No cells selected, cannot fetch image preview.");
    }
    // *** END NEW STEP 5.5 ***

    // 6. Format the 'cells' array for the board
    const boardCells = selectedCells.map(cell => ({
        cellId: String(cell._id),
        cellType: "cell" // Assuming all are 'cell' type
    }));

    // 7. Create final board object with new fields
    const finalBoard = {
        name: BOARD_NAME,
        numCells: boardCells.length,
        type: BOARD_TYPE,
        userId: USER_ID,
        imgPreview: firstCellImageUrl,       // *** ADDED imgPreview ***
        tags: [TARGET_CATEGORY.toLowerCase()], // *** ADDED tags array ***
        cells: boardCells
    };

    // 8. Save
    const outputFilePath = path.join(process.cwd(), OUTPUT_JSON_FILE);
    try {
        console.log(`\nSaving the final board structure to ${outputFilePath}...`);
        const outputJsonData = JSON.stringify(finalBoard, null, 2);
        fs.writeFileSync(outputFilePath, outputJsonData, 'utf8');
        console.log('Board saved successfully!');
        console.log(` -> Name: ${finalBoard.name}`);
        console.log(` -> Number of Cells: ${finalBoard.numCells}`);
        console.log(` -> Type: ${finalBoard.type}`);
        console.log(` -> User ID: ${finalBoard.userId}`);
        console.log(` -> Image Preview: ${finalBoard.imgPreview}`); // Log new field
        console.log(` -> Tags: ${JSON.stringify(finalBoard.tags)}`);   // Log new field
    } catch (error) {
        console.error(`\nFile Error: Failed to save the board to ${outputFilePath}:`, error.message);
        process.exit(1);
    }

    console.log('\n--- Script finished ---');
}

// --- Run the main function ---
createAnimalBoardWithTextFromAPI().catch(error => {
    console.error("\n--- Unexpected Error during script execution ---");
    console.error(error);
    process.exit(1);
});