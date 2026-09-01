import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/config/app_config.dart';
import 'core/theme/material3_theme.dart';
import 'app/routes.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Cargar variables de entorno de forma segura
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("Archivo .env no encontrado, usando configuración predeterminada");
  }

  // Inicializar Supabase si las credenciales están presentes
  await AppConfig.initSupabase();

  runApp(const ProviderScope(child: NegocioFlexApp()));
}

class NegocioFlexApp extends StatelessWidget {
  const NegocioFlexApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Negocio Flex',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: appRouter,
    );
  }
}
