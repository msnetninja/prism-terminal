import express from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase';

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        const response = await supabase.from('users').insert([{
            email: email,
            username: username
        }]);

        if (response.error) {
            throw response.error;
        }

        res.status(201).json();
    } catch (error: any) {
        console.error('Error signing up:', error.message);
        res.status(500).json();
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        const { data } = await supabase.from('users').select('*').eq('email', email).single();

        const secretKey = process.env.SECRET_KEY;
        const token = jwt.sign(data, secretKey);

        res.status(200).json({ user: { ...data, token: token } });
    } catch (error: any) {
        console.error('Error signing in:', error.message);
        res.status(500).json();
    }
});

router.post('/signout', async (req, res) => {
    try {

    } catch (error: any) {
        console.error('Error signing out:', error.message);
        res.status(500).json();
    }
});

router.post('/update', async (req, res) => {
    try {
        const { email, username, wallet, social, api } = req.body;

        const { error } = await supabase.from('users').update({
            username: username,
            wallet: wallet,
            social: social,
            api: api
        }).eq('email', email);

        if (error) {
            throw error;
        }

        res.status(200).json();
    } catch (error: any) {
        console.error('Error updating profile:', error.message);
        res.status(500).json();
    }
});

export default router;