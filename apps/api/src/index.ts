import express from "express";
import { Express } from "express";
const app: Express = express();


app.get("/", (req, res) => {

    res.send(
`Ï
<h1>Hello World</h1>
<h3> Status : Healthy</h3>


`
    )
})


export default app;