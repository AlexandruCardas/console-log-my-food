const jsonServer = require('json-server');
const axios = require('axios');
const CAF = require('caf');

const server = jsonServer.create(); // create a server object
const router = jsonServer.router('src/db.json');
const middleware = jsonServer.defaults();

server.use(middleware);
server.use(router);
server.listen(3001, () => {
  console.log('JSON server is running');
});

const token = new CAF.timeout(500, 'This is taking too long!'); // 300 is too short
const fetchCAF = CAF(function* fetchData(signal) {
  yield CAF.delay(signal, 400);
  return yield axios.get('http://localhost:3001/users');
});

fetchCAF(token).then(response => {
  console.log(response.data);
}).catch(error => {
  console.log(error);
});


// const it = fetchData();
// it.next().value.then(response => {
//   console.log(response.data);
//   console.log(it.next());
// });
