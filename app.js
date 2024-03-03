const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeAndStartDatabase = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at Port:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e}`)
    process.exit(1)
  }
}
initializeAndStartDatabase()

const formattedData = data => {
  return {
    districtId: data.district_id,
    districtName: data.district_name,
    stateId: data.state_id,
    cases: data.cases,
    cured: data.cured,
    active: data.active,
    deaths: data.deaths,
  }
}

const filteredStateData = data => {
  return {
    stateId: data.state_id,
    stateName: data.state_name,
    population: data.population,
  }
}

app.get('/states/', async (request, response) => {
  const getStateArray = `
    SELECT *
    FROM state
   
    `
  const stateArray = await db.all(getStateArray)
  response.send(stateArray.map(each => filteredStateData(each)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateDetails = `
  SELECT 
      state_id as stateId,
      state_name as stateName,
      population as population
  FROM state
  WHERE state_id=${stateId};

  `
  const stateDetails = await db.get(getStateDetails)
  response.send(stateDetails)
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const getPostedQuery = `
  INSERT INTO
  district(district_name,state_id,cases,cured,active,deaths)
  VALUES
  ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}')
  `
  const newArray = await db.run(getPostedQuery)

  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictDetails = `
  SELECT *
  FROM district
  WHERE district_id=${districtId}
  `
  const districtDetails = await db.get(getDistrictDetails)
  response.send(formattedData(districtDetails))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDeletedDistrict = `
  DELETE FROM 
  district
  WHERE district_id=${districtId}
  `
  const deletedDistrict = await db.run(getDeletedDistrict)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const getUpdatedDistrict = `
  UPDATE
  district
  SET
  district_name='${districtName}',
  state_id='${stateId}',
  cases='${cases}',
  cured='${cured}',
  active='${active}',
  deaths='${deaths}'
  WHERE district_id=${districtId}
  `
  const updatedDistrict = await db.get(getUpdatedDistrict)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateDetails = `
  SELECT SUM(cases) as totalCases, SUM(cured) as totalCured, SUM(active) as totalActive,SUM(deaths) as totalDeaths
  FROM district
  WHERE state_id=${stateId}
  `
  const stateDetails = await db.get(getStateDetails)
  response.send(stateDetails)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {stateId, districtId} = request.params
  const getDistrictDetails = `
  SELECT state_name as stateName
  FROM district 
  NATURAL JOIN state
  WHERE district_id=${districtId}

  `
  const districtDetails = await db.get(getDistrictDetails)
  response.send(districtDetails)
})

module.exports = app
