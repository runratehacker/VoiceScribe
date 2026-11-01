// hook to get the available papers from the backend 

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const useForm = () => {

    const [forms, setForms] = useState([]);

    const getForms = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/papers`);
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
