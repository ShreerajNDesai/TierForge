const { HowLongToBeatService } = require('howlongtobeat-ts');

const hltbService = new HowLongToBeatService();

async function test() {
  try {
    const results = await hltbService.search('Red Dead Redemption 2');
    console.log(results);
  } catch (error) {
    console.error(error);
  }
}

test();
