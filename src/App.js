import './App.css';
import React, { Component } from 'react';
import { Form, Button, Card, Table, InputGroup, FormControl } from 'react-bootstrap';

const axios = require('axios').default;

/**
 * recipe Format
 * ingredients: [{name: measure: {amount: name: }}]
 */
class App extends Component {
  constructor(up) {
    super(up)
    this.isMaster = window.location.pathname === "/master"
    const testRecipeMap = {
      "https://tasty.co/recipe/pizza-dough": {"ingredients": [{"name":"water","comment":"warm","measure":{"amount":2.5,"name":"cup","cup":5}},{"name":"sugar","measure":{"amount":1,"name":"teaspoon","cup":0.041666}},{"name":"yeast","comment":"active dry","measure":{"amount":2,"name":"teaspoon","cup":0.083332}},{"name":"flour","comment":"all purpose","measure":{"amount":7,"name":"cups","cup":14}},{"name":"olive oil","comment":"extra virgin","measure":{"amount":6,"name":"tablespoons","cup":0.75}},{"name":"salt","comment":"kosher","measure":{"amount":1.5,"name":"teaspoon","cup":0.124999}},{"name":"semolina flour","measure":{"amount":0.25,"name":"cup","cup":0.5}},{"name":"tomatoes","comment":"canned whole","measure":{"amount":1,"name":"oz","cup":0.3192511261261261}}]}
    }

    this.state = JSON.parse(window.localStorage.getItem('state')) || {
      url: "",
      recipeList: testRecipeMap,
      iList: this.addIfromR(testRecipeMap["https://tasty.co/recipe/pizza-dough"], {}),
      sList: {},
    }
    console.log("XX", this.state)
    this.submit = this.submit.bind(this)
    this.change = this.change.bind(this)
    this.onCheck = this.onCheck.bind(this)
    this.updateState = this.updateState.bind(this)
  }

  updateState(state) {
    return this.setState(state, () => {
      window.localStorage.setItem('state', JSON.stringify(this.state))
    })
  }

  /**
   *
   * @param {React.FormEvent} e
   */
  change(e) {
    console.log("change", e.target.value)
    return this.updateState({
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
    const targetUrl = this.state.url
    const url = `https://faas.schollz.com/?import=github.com/schollz/ingredients&func=IngredientsFromURL(%22${targetUrl}%22)`
    console.log("submit", this.state.url, url)
    return axios.get(url)
    .then((response) => {
      // handle success
      if (response.data.err) {
        return console.log("ERROR", response.data.err)
      }
      response.data.ingredients.forEach((i) => {
        if (i.measure.name[i.measure.name.length -1] === 's') {
          i.measure.name = i.measure.name.substring(0, i.measure.name.length - 1);
        }
      })
      const recipeList = {...this.state.recipeList}
      recipeList[targetUrl] = {
        ingredients: response.data.ingredients
      }
      return this.updateState({
        iList: this.addIfromR(response.data, this.state.iList),
        recipeList,
        url: ""

      })
    })
    .catch((error) => {
      // handle error
      console.log("XXX ERROR", error);
    })
  }

  renderUnits(unitsMap) {
    return Object.keys(unitsMap).map((unitName, id) => {
      const amount = unitsMap[unitName]
      return (
        <InputGroup.Text key={id}> {(id > 0) ? '+' : ''} {amount} {unitName}</InputGroup.Text>
      )
    })
  }

  renderIngredients(iMap, requiredState) {
    return Object.keys(iMap).map((iName, idx) => {
      const unitsMap = iMap[iName]
      const state = this.state.sList[iName] || false
      if (state !== requiredState) {
        return null
      }
      return (
        <InputGroup className="mb-1" key={idx}>
          <InputGroup.Checkbox checked={state} aria-label="Checkbox for state" onChange={(e) => {this.onCheck(e, iName)}}/>
          <FormControl id="basic-url" value={iName} readOnly/>
            {this.renderUnits(unitsMap)}
        </InputGroup>
      )
    })
  }

  addIfromR(recipe, iMap) {
    recipe.ingredients.forEach((cI) => {
      let existingI = iMap[cI.name]
      if(!existingI) {
        iMap[cI.name] =  {}
      }
      let iV = iMap[cI.name][cI.measure.name]
      if(!iV) {
        iMap[cI.name][cI.measure.name] = cI.measure.amount
        return
      }
      iMap[cI.name][cI.measure.name] += cI.measure.amount
    })

    return iMap
  }

  onCheck(e, iName) {
    const sList = this.state.sList
    sList[iName] = e.target.checked
    return this.updateState({
      sList
    })
  }

  renderIngredientTable(recipe) {
    return recipe.ingredients.map((ingredient, idx) => {
      return (
        <tr key={idx}>
          <td>{ingredient.name} ({ingredient.comment})</td>
          <td>{ingredient.measure.amount}</td>
          <td>{ingredient.measure.name}</td>
        </tr>
    )
    })
  }

  renderRecipeList(recipeList) {
    return Object.keys(recipeList).map((url, idx) => {
      const recipe = recipeList[url]
      if (!recipe) { return null }
      return (
        <Card className='mb-3' key={idx} bg='dark' text='white'>
          <Card.Header as="h5">{url}</Card.Header>
          <Card.Body>
            <Table striped bordered hover variant="dark">
              <tbody>
                {this.renderIngredientTable(recipe)}
              </tbody>
            </Table>
          <Button onClick={(e) => {this.removeRecipe(url)}} variant="secondary">remove</Button>
          </Card.Body>
        </Card>
      )
    })
  }

  removeRfromI(recipe, iMap) {
    recipe.ingredients.forEach((cI) => {
      let existingI = iMap[cI.name]
      if(!existingI) {
        return console.error("missing ingredient")
      }
      let iV = iMap[cI.name][cI.measure.name]
      if(!iV) {
        return console.error("missing measure")
      }
      iMap[cI.name][cI.measure.name] -= cI.measure.amount
      if (iMap[cI.name][cI.measure.name] <= 0) {
        delete iMap[cI.name][cI.measure.name]
      }
      if (Object.keys(iMap[cI.name]).length < 1) {
        delete iMap[cI.name]
      }
    })

    return iMap
  }

  syncSList(currentI, currentS) {
    Object.keys(currentS).forEach((iName) => {
      if(!currentI[iName]) {
        delete currentS[iName]
      }
    })

    return currentS
  }

  removeRecipe(url) {
    const recipeList = this.state.recipeList
    const recipe = recipeList[url]
    delete recipeList[url]

    const iList = this.removeRfromI(recipe, this.state.iList)
    const sList = this.syncSList(iList, this.state.sList)
    return this.updateState({
      recipeList,
      iList,
      sList,
    })
  }

  render() {
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
          <div>
            <h1>List</h1>
            {this.renderIngredients(this.state.iList, false)}
          </div>

          <div>
            <h1>Got</h1>
            {this.renderIngredients(this.state.iList, true)}
          </div>
            <h1>recipe list</h1>
            <div>

            {this.renderRecipeList(this.state.recipeList)}
            </div>
        </header>
      </div>
    );
  }
}

export default App;
