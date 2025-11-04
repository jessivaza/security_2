import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
//TEST DE PÁGINA DE INCIO 
const Inicio = ({ navigation }) => {
    const handlePress = () => {
        alert('¡Bienvenido a la aplicación!');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.welcomeText}>
                ¡Bienvenido a nuestra aplicación móvil!
            </Text>
            <TouchableOpacity
                style={styles.button}
                onPress={handlePress}
            >
                <Text style={styles.buttonText}>Presionar aquí</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        elevation: 3, // Para Android
        shadowColor: '#000', // Para iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default Inicio;