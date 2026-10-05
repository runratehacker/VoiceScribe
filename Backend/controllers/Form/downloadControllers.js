
import downloadFactorizationController from './downloadFactorizationController.js'
import downloadSSTController from './downloadSSTController.js'
import downloadScienceController from './downloadScienceController.js'

// Array of controller functions

const downloadControllers = [{
    id: 1,
    controller: downloadFactorizationController
},
{
    id: 2,
    controller: downloadSSTController
},
{
    id: 3,
    controller: downloadScienceController
}]

export { downloadControllers }