async function test() {
  const res = await fetch(
    'https://store.steampowered.com/search/results/?query&start=0&count=200&tags=19&category1=998&ignore_preferences=1&supportedlang=english&infinite=1'
  )
  const data = await res.json()
  const html = data.results_html
  const titles = []
  const regex = /<span class="title">([^<]+)<\/span>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    titles.push(match[1])
  }
  console.log(titles.length)
}
test()
