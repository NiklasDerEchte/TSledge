import dotenv from 'dotenv';
import * as tsledge from '../src/index';
import User from './models/user';
import router from './routes';
import UserGroup from './models/user-group';

dotenv.config();

const PORT = process.env.PORT || 3000;
const URI = process.env.MONGODB_URI as string;
let fluentApi: tsledge.FluentAPIPath[] = [
  {
    model: User,
    filters: ['username'],
  },
  {
    model: UserGroup,
  },
];
export async function setup() {
  new tsledge.FluentPatternHandler(fluentApi);
  tsledge.connectMongoDB(URI).then(() => {
    let app = tsledge.createApp();
    app.use('/', router);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

setup();