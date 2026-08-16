import { readFileSync } from 'fs'
import { join } from 'path'

describe('splash vs project home copy', () => {
  it('does not put the old homepage argument on the public splash', () => {
    const splash = readFileSync(join(__dirname, '../../app/page.tsx'), 'utf8')
    const door = readFileSync(join(__dirname, '../../components/SplashDoor.tsx'), 'utf8')
    const home = readFileSync(join(__dirname, '../../app/home/page.tsx'), 'utf8')
    expect(splash).toMatch(/SplashDoor/)
    expect(door).toMatch(/This side is the ward/)
    expect(door).not.toMatch(/What did this cost us/)
    expect(home).toMatch(/What did this cost us/)
  })
})
