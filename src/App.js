import './App.css';
import { Component } from 'react';
import { Form, Button, Card, Table } from 'react-bootstrap';

const axios = require('axios').default;

class App extends Component {
  constructor(up) {
    super(up)
    this.isMaster = window.location.pathname === "/master"
    this.state = {
      url: "",
      list: {},
    }
    this.submit = this.submit.bind(this)
    this.change = this.change.bind(this)
  }
  /**
   *
   * @param {React.FormEvent} e
   */
  change(e) {
    console.log("change", e.target.value)
    return this.setState({
      url: e.target.value
    })
  }
  /**
   *
   * @param {React.FormEvent} e
   */
  submit(e) {
    e.preventDefault()
    e.stopPropagation()
    // const url = 'https://tasty.co/recipe/pizza-dough'
    const targetUrl = this.state.url
    const url = `https://faas.schollz.com/?import=github.com/schollz/ingredients&func=IngredientsFromURL(%22${targetUrl}%22)`
    console.log("submit", this.state.url, url)
    return axios.get(url)
    .then((response) => {
      // handle success
      if (response.data.err) {
        return console.log("ERROR", response.data.err)
      }
      const list = {...this.state.list}
      list[targetUrl] = {
        ingredients: response.data.ingredients
      }
      return this.setState({
        list,
        url: ""
      })
    })
    .catch((error) => {
      // handle error
      console.log("XXX ERROR", error);
    })
  }

  render() {
    const final = () => {
      const iMap = Object.keys(this.state.list).reduce((pv,  cv)=> {
        const ingredients = this.state.list[cv].ingredients
        ingredients.forEach((cI) => {
          let pI = pv[cI.name]
          if(!pI) {
            pv[cI.name] =  {}
          }
          let iV = pv[cI.name][cI.measure.name]
          if(!iV) {
            pv[cI.name][cI.measure.name] = cI.measure.amount
            return
          }
          pv[cI.name][cI.measure.name] += cI.measure.amount
        })

        return pv
      }, {})

      return (
        <Table striped bordered hover variant="dark">
          <tbody>
            {Object.keys(iMap).map((iName, idx) => {
              const vs = iMap[iName]
              return (
                <tr key={idx}>
                  <td>{iName}</td>
                  {Object.keys(vs).map((name, iidx) => {
                    const amount = vs[name]
                    return (
                      <td key={iidx}>{amount} {name}</td>
                    )
                  })}
                </tr>
            )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <div className="App">
        <header className="App-header">
          <Form>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Url</Form.Label>
              <Form.Control value={this.state.url} onChange={this.change} type="url" placeholder="Enter url" />
              <Button onClick={this.submit} className="mb-2">Submit</Button>
            </Form.Group>
          </Form>
          {final()}
            {Object.keys(this.state.list).map((url, idx) => {
              const recipe = this.state.list[url]
              if (!recipe) { return null }
              return (
                <Card key={idx} bg='dark' text='white'>
                  <Card.Header as="h5">{url}</Card.Header>
                  <Card.Body>
                    <Card.Text>
                      <Table striped bordered hover variant="dark">
                        <tbody>
                          {recipe.ingredients.map((ingredient, idx) => {
                            return (
                              <tr key={idx}>
                                <td>{ingredient.name} ({ingredient.comment})</td>
                                <td>{ingredient.measure.amount}</td>
                                <td>{ingredient.measure.name}</td>
                              </tr>
                          )
                          })}
                        </tbody>
                      </Table>
                    </Card.Text>
                  </Card.Body>
                </Card>
              )
            })}
        </header>
      </div>
    );
  }
}

export default App;
