import 'dotenv/config';
import { app } from './app/module/app.js';
import { connectDB } from './app/common/db/db.js';

const PORT: number = Number(process.env.PORT) || 3000;

// Db connection

connectDB()

// Server started

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
