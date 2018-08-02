import { gregorianToJalaali } from '../src/persian-calendar'

it('simple test', () => {
  const x = gregorianToJalaali(2018, 7, 31)
  console.log(x)
})
