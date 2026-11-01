import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';


dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

// const { error } = await supabase.from("STUDENT").insert({
//     Name: "admin",
//     Username: "admin",
//     Password: "password123",
//     Grade: "8"

// });

// const { error, data } = await supabase.from("STUDENT").select("Password").eq("Username", "admin").single();


// if (error) {
//     console.log(error);
// }
// else console.log(data.Password);

// const { error, data } = await supabase.from("PAPER").select("*");

// const { error, data } = await supabase.from("PAPER").select("*").eq("id", 1)

// console.log(data);

export default supabase;