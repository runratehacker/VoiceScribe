

const checkRole = (allowedRoles = []) => {

    return (req, res, next) => {

        if (!req.user || !allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                message: `Forbidden: Access requires role to be one of [${allowedRoles.join(', ')}]`
            });

        }

        next();
    }

}

export { checkRole };