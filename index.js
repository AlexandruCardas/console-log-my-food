#! /usr/bin/env node
// Reads lines one by one.
const axios = require('axios');
const readline = require('readline').createInterface({
  input: process.stdin, // from terminal
  output: process.stdout, // to terminal
  prompt: 'enter command > '
});

readline.prompt();
/**
 * @param food.dietary_preferences
 * @param {string} position.value.calories
 */
readline.on('line', async line => {
  switch (line.trim()) {
    case 'list vegan foods': {
      const { data } = await axios.get(`http://localhost:3001/food`);

      function* listVeganFoods() {
        try {
          let idx = 0;
          const veganOnly = data.filter(food => food.dietary_preferences.includes('vegan'));
          while (veganOnly[idx]) {
            yield veganOnly[idx];
            idx++;
          }
        } catch (e) {
          console.log(`Something went wrong while listing vegan items ${{ e }}`);
        }
      }

      // const veganIterable = {
      //   [Symbol.iterator]() {
      //     return {
      //       [Symbol.iterator]() {
      //         return this;
      //       },
      //       next() {
      //         const current = veganOnly[idx];
      //         idx++;
      //         if (current) {
      //           return { value: current, done: false };
      //         } else {
      //           return { value: current, done: true };
      //         }
      //       }
      //     };
      //   }
      // };
      for (let val of listVeganFoods()) {
        console.log(val.name);
      }
      readline.prompt();
    }
      break;
    case 'log' :
      const { data } = await axios.get(`http://localhost:3001/food`);
      const it = data[Symbol.iterator]();
      let actionIt;

      // const actionIterator = {
      //   [Symbol.iterator]() {
      //     let positions = [...this.actions];
      //
      //     return {
      //       [Symbol.iterator]() {
      //         return this;
      //       },
      //       next(...args) {
      //         if (positions.length > 0) {
      //           const position = positions.shift();
      //           const result = position(...args);
      //           return { value: result, done: false };
      //         } else {
      //           return { done: true };
      //         }
      //       },
      //       return() {
      //         positions = [];
      //         return { done: true };
      //       },
      //       throw(error) {
      //         console.log(error);
      //         return { value: undefined, done: true };
      //       }
      //     };
      //   },
      //   actions: [askForServingSize, displayCalories]
      // };
    function* actionGenerator() {
      try {
        const food = yield;
        const servingSize = yield askForServingSize();
        yield displayCalories(servingSize, food);
      } catch (error) {
        console.log({ error });
      }
    }

    function askForServingSize() {
      readline.question(`How many servings did you eat? (as a decimal: 1, 0.5, 1.25, etc... `,
        servingSize => {
          if (servingSize === 'nevermind' || servingSize === 'n') {
            actionIt.return();
          } else if (typeof Number(servingSize) !== 'number' || isNaN(Number(servingSize))) {
            actionIt.throw('Please, numbers only');
          } else {
            actionIt.next(servingSize);
          }
        });
    }

    // can also use Number, or Number.parseInt.
    async function displayCalories(servingSize = 1, food) {
      const calories = food.calories;
      console.log(`${food.name} with a serving size of ${servingSize} has a ${(calories * servingSize).toFixed()} calories.`);
      const { data } = await axios.get('http://localhost:3001/users/1');
      const usersLog = data.log || [];
      const putBody = {
        ...data,
        log: [...usersLog, {
          [Date.now()]: {
            food: food.name,
            servingSize,
            calories: (calories * servingSize).toFixed()
          }
        }]
      };
      await axios.put('http://localhost:3001/users/1', putBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      actionIt.next();
      readline.prompt();
    }

      readline.question(`What would you like to log today? `, item => {
        let position = it.next();
        while (!position.done) {
          const food = position.value.name;
          if (food === item) {
            console.log(`A single serving of ${item} has ${position.value.calories} calories`);
            actionIt = actionGenerator();
            actionIt.next();
            actionIt.next(position.value);
          }
          position = it.next();
        }
        readline.prompt();
      });
      break;
    case `today's log`:
      readline.question(`Email: `, async emailAddress => {
        const { data } = await axios.get(
          `http://localhost:3001/users?email-${emailAddress}` // axios lets you filter
        );
        const foodLog = data[0].log || [];
        let totalCalories = 0;

        function* getFoodLog() {

          try {
            yield* foodLog;
          } catch (e) {
            console.log(`Error reading the food log ${{ e }}`);
          }
        }

        const logIterator = getFoodLog();

        for (const entry of logIterator) {
          const timestamp = Object.keys(entry)[0];
          if (isToday(new Date(Number(timestamp)))) {
            console.log(
              `${entry[timestamp].food}, ${entry[timestamp].servingSize} serving(s)`
            );
            totalCalories += entry[timestamp].calories;
            if (totalCalories > 12000) {
              console.log(`Impressive! You've reached 12,000 calories`);
              logIterator.return(); // You won't see any products after reaching 12000
            }
          }
        }
        console.log('-'.repeat(10));
        console.log(`Total Calories: ${totalCalories}`);
        readline.prompt();
      });
      break;
  }
  readline.prompt();
});

function isToday(timestamp) {
  const today = new Date();
  return (
    timestamp.getDate() === today.getDate() &&
    timestamp.getMonth() === today.getMonth() &&
    timestamp.getFullYear() === today.getFullYear()
  );
}
