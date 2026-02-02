const jwt = require('jsonwebtoken');

// Usuario configurado en variables de entorno
const AUTH_USER = process.env.AUTH_USER || 'admin@copec.cl';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Verificar credenciales
    if (email !== AUTH_USER || password !== AUTH_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        email,
        nombre: email.split('@')[0]
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el login',
      error: error.message
    });
  }
};

exports.verificarToken = async (req, res) => {
  try {
    // Si llegó aquí es porque pasó el middleware de auth
    res.json({
      success: true,
      message: 'Token válido',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verificando token'
    });
  }
};
