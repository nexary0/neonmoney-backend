const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your frontend website to talk to this backend
app.use(cors({
    origin: '*' 
}));
app.use(express.json());

// A simple test to make sure the robot is awake
app.get('/', (req, res) => {
    res.send('NeonMoney Backend Robot is Awake and Running! 🤖');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
