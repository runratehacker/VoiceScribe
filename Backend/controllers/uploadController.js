

const uploadPaper = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: 'No PDF attached'
            });
        }

        const fileBuffer = req.file.buffer;





    } catch (error) {

    }

}

export { uploadPaper };