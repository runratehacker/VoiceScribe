
import downloadFactorizationController from './downloadFactorizationController.js'
import downloadSSTController from './downloadSSTController.js'



// Array of controller functions

const downloadControllers = [{
    id: 1,
    controller: downloadFactorizationController
},
{
    id: 2,
    controller: downloadSSTController
}]

export { downloadControllers }