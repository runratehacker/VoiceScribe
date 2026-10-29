import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';


dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

const { error } = await supabase.from("STUDENT").insert({
    Name: "admin",
    Username: "admin",
    Password: "password123",
    Grade: "8"

});

if (error) {
    console.log(error);
}

export default supabase;