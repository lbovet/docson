const puppeteer = require('puppeteer');
const path = require('path');

jest.setTimeout(50000);

const server = new Promise( resolve => {
    let app = require( '../src/server' )({ directory: path.join( __dirname, '..' ) });
    let server;
    server = app.listen( 3000, () => resolve(server) );
}).catch( e => console.log(e) );

const browser = puppeteer.launch({ headless: false });

const rootUrl = "http://localhost:3000/public/index.html";

beforeAll( async () => { await server }, 50000 );
afterAll( async () => { 
    ( await server ).close();
    ( await browser ).close(); 
} );
  
test( 'relative paths', async () => {
    const page = await ( await browser ).newPage();

    await page.goto( rootUrl + "#/integration/schemas/relative.json");
    
    await page.waitFor('//*[@id="doc"]/div[1]/div[3]/div[2]/div[2]/div/div[1]/div[3]/div[2]/div[2]/div/div[1]/div[3]/div[2]/div[1]/div[3]/p');

    let text = await page.evaluate( () => document.querySelector('p').innerText );

    expect(text).toMatch( 'a baz string' );


    await page.close();

});

test('resolve #definitions in non-root schema', async () => {
    const page = await ( await browser ).newPage();

    await page.goto( rootUrl + "#/integration/schemas/def-non-root/User.json");

    await page.waitFor(5000);
    
    await expect( 
        page.evaluate( () => Array.from(document.querySelectorAll('.property-name').values()).map( s => s.innerText ) )
    ).resolves.toContain( 'oderOfFirstLastName' );

    await page.close();

});

test('local schema, absolute path', async () =>  {
    const page = await ( await browser ).newPage();

    await page.goto( rootUrl + "#/integration/schemas/local-absolute/main.json");

    await page.waitFor(5000);
    
    await expect( 
        page.evaluate( () => Array.from(document.querySelectorAll('.desc').values()).map( s => s.innerText ) )
    ).resolves.toContain( "a foo number\n" );

    await page.close();

});

test('recursive schemas', async () => {
    const page = await ( await browser ).newPage();

    await page.goto( rootUrl + "#/integration/schemas/recursive/circle.json");

    await page.waitFor(5000);

    await expect( 
        page.evaluate( () => Array.from(document.querySelectorAll('.desc').values()).map( s => s.innerText ) )
    ).resolves.toContain( "circular reference\n" );

    await page.close();
});


test('recursive schemas, part II', async () => {
    const page = await ( await browser ).newPage();

    await page.goto( rootUrl + "#/integration/schemas/recursive/within_schema.json");
    await page.waitFor(5000);

    let results = await
        page.evaluate( () => Array.from(document.querySelectorAll('p').values()).map( s => s.innerText ) );

    expect(results).toContain( 'circular definitions' );
});

test('pretty big schema', async () => {
    const page = await ( await browser ).newPage();

    await page.goto( rootUrl + "#/integration/schemas/release-schema.json");
    await page.waitFor( '//*[@id="doc"]/div[1]/div[3]/div[12]/div[2]/div/div[1]/div[3]/div[11]/div[1]/div[3]/p');

    let results = await
        page.evaluate( () => Array.from(document.querySelectorAll('p').values()).map( s => s.innerText ) );

    expect(results).toContain( 'All documents and attachments related to the contract, including any notices.' );
});
