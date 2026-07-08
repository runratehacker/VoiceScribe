// hook to get the available forms from the backend 

import { useState, useEffect } from 'react';
import axios from 'axios';

export const useForm = () => {

    const [forms , setForms] = useState([]);
    // forms = [{id: 1, name: 'Admission Form'}, {id: 2, name: 'SBI Form'}]

   const getForms = async () => {
        try {
            const response = await axios.get('http://localhost:8044/api/forms');
            setForms(response.data);
        } catch (error) {
            console.log(error.message);
            return [];
        }
    }

    useEffect(() => {
        getForms();
    }, [])

    return { forms };

}