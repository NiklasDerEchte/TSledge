import dotenv from 'dotenv';
import * as tsledge from '../src/index';

dotenv.config();

const PORT = process.env.PORT || 3000;
const URI = process.env.MONGODB_URI as string;

export async function setup() {
  tsledge.connectMongoDB(URI).then(() => {
    let app = tsledge.createApp();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}