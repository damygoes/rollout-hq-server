import app from './app';
import { ENV } from './config/env';

app.listen(ENV.PORT, () => {
  console.warn(`API listening on http://localhost:${ENV.PORT}`);
});
