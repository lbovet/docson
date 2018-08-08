const path       = require('path');
const express    = require('express');

const puppeteer = require('puppeteer')

const rootUrl = "http://localhost:3000/";

jest.setTimeout(500000);

const server = new Promise( resolve => {
    let app = require( '../src/server' )({ directory: path.join( __dirname, '..' ) });
    let server;
    server = app.listen( 3000, () => resolve(server) );
}).catch( e => console.log(e) );

const browser = puppeteer.launch({ headless: false });

beforeAll( async () => { await server; await browser }, 10000 );
afterAll( async () => { 
    ( await server ).close();
    ( await browser ).close(); 
} );


test( 'basic', async () => {
    const page = await ( await browser ).newPage();

    await page.goto(  rootUrl + '/integration/widget/basic.html' );

    await page.waitForSelector('iframe');

    let frames = await page.frames();

    await page.waitFor(2000);

    let title = await frames[1].evaluate( 
        () => document.querySelector('.title').innerText 
    );

    expect(title).toEqual( 'Product set' );

});
