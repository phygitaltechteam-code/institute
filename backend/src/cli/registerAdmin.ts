import {Role} from '@prisma/client';
import prisma from '../client';
import readline from 'readline';
import {userValidation} from '../validations/index';
import {z} from 'zod';
import {encryptPassword} from '../utils/index';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const userInputSchema = userValidation.registerUserSchema.omit({
    role: true,
});

type UserInput = z.infer<typeof userInputSchema>;

const registerAdminUser = async (userInput: UserInput) => {
    userInput.password = await encryptPassword(userInput.password);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                {username: userInput.username},
                {email: userInput.email},
                {phoneNumber: userInput.phoneNumber},
            ],
        },
    });

    if (existingUser) {
        console.error('User already exists with the provided username, email, or phone number.');
        rl.close();
        return;
    }

    try {
        await prisma.user.create({
            data: {
                ...userInput,
                role: Role.ADMIN,
                isVerified: true,
                verifyCode: undefined,
                verifyCodeExpiry: undefined,
            },
        });

        //console.log(`New admin user created successfully: ${newUser.username} (ID: ${newUser.id})`);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
};

const questions: (keyof UserInput)[] = ['username', 'fullname', 'email', 'password', 'phoneNumber'];

const promptForInputs = async (): Promise<UserInput> => {
    const answers: Partial<UserInput> = {};

    for (const question of questions) {
        answers[question] = await new Promise<string>((resolve) => {
            rl.question(`Enter ${question}: `, resolve);
        });
    }

    return answers as UserInput;
};

const main = async () => {
    try {
        const userInput = await promptForInputs();

        userInputSchema.parse(userInput);

        await registerAdminUser(userInput);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation error:', error.errors);
        } else {
            console.error('Error:', error);
        }
    }
};

main();
