import supabase from "../supabase.js";
import buildPaperPdf from "../template/generatePaper.js"



const generatePaper = async (req, res) => {

    try {
        const { pdfBytes, filename, outputPath } = await buildPaperPdf(req.body);

        let { data, error } = await supabase.storage.from('papers').upload(`public/${filename}.pdf`,
            Buffer.from(pdfBytes), {
            contentType: 'application/pdf',
            upsert: true,
        }
        );

        if (error) {
            console.log(error);
            return res.status(500).json({
                message: 'Error saving paper in the Database'
            });
        }

        let { data: data1, error: error1 } = await supabase.storage.from('papers').createSignedUrl(`public/${filename}.pdf`, 60, {
            download: true
        })

        return res.status(200).json({
            message: 'PDF generated and saved successfully',
            filename,
            outputPath,
            signedUrl: data1.signedUrl
        });

    } catch (error) {

        console.error('Error Generating paper:', error);

        return res.status(500).json({
            message: 'Failed to generate paper PDF',
            error: error.message,
        });
    }

}

export default generatePaper;