//import libraries
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as bodyParser from "body-parser";

//initialize firebase inorder to access its services
admin.initializeApp(functions.config().firebase);

//initialize express server
const app = express();
const main = express();

//add the path to receive request and set json as bodyParser to process the body 
main.use('', app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));

//initialize the database and the collection 
const db = admin.firestore();

type Movie = {likes: String[], nopes: String[], undecided: String[]};
type SwipeCollection =  {
    name: string,
    creatorUID: string,
    creationDate: Date,
    members: string[],
    id?: string,
    plannedDate?: Date,
    filter?: any,
    movieIdList?: number[],
    tmdbListId?: number
}
type SwipeResult = "like" | "nope" | "superLike";

type SwipeDto = {
    swipeCollectionId: string,
    movieId: number,
    userId:string,
    swipeResult: SwipeResult
}

type MatchesDto = {
    swipeCollectionId: string,
}

type SwipeCollectionDto = {
    swipeCollectionId: string,
    userId:string,
}

app.post('/swipe', async (req, res) => {
    try {
        const swipeDto: SwipeDto = req.body as SwipeDto


        const collection = 'swipeCollection';
        const subCollection = 'movies';

        const result = db.collection(collection).doc(swipeDto.swipeCollectionId).collection(subCollection).doc(swipeDto.movieId.toString());
        let swipeCollection : SwipeCollection = (await (await db.collection(collection).doc(swipeDto.swipeCollectionId)).get()).data() as unknown as SwipeCollection;
        if(swipeCollection.members.filter(m => m === swipeDto.userId).length === 0){
            res.status(500).send('error');
        }
        console.log(swipeDto);
        if(result !== null){
            if(swipeDto.swipeResult === 'like'){
                await result.update({
                    likes: admin.firestore.FieldValue.arrayUnion(swipeDto.userId),
                });
            }
            else if(swipeDto.swipeResult === "superLike"){
                await result.update({
                    likes: admin.firestore.FieldValue.arrayUnion(swipeDto.userId),
                });
            }
            else if(swipeDto.swipeResult === "nope"){
                await result.update({
                    nopes: admin.firestore.FieldValue.arrayUnion(swipeDto.userId),
                });
            }
        }
        const movieSwipe : Movie = (await db.collection(collection).doc(swipeDto.swipeCollectionId).collection(subCollection).doc(swipeDto.movieId.toString()).get()).data() as unknown as Movie;
        if(swipeCollection !== null){
            if(movieSwipe.likes.length === swipeCollection.members.length){
                res.status(200).json({match: true});
                return;
            }
            else{
                res.status(200).json({match: false});
                return;
            }
        }
        res.status(200).json({match: false});
        return;
    } catch (error) {
        res.status(200).json(req.body);
    }
});
app.post('/swipeCollection', async (req, res) => {
    try {
        const swipeCollectionDto: SwipeCollectionDto = req.body as SwipeCollectionDto
        const collection = 'swipeCollection';

        const result = await db.collection(collection).doc(swipeCollectionDto.swipeCollectionId);
        if(result !== null){
            if(swipeCollectionDto.userId !== null){
                await result.update({
                    members: admin.firestore.FieldValue.arrayUnion(swipeCollectionDto.userId),
                });
                res.status(200).json({added: true});
            }
        }
        res.status(200).json({added: false});
    } catch (error) {
        res.status(500).send(error);
    }
});

app.patch('/swipeCollection', async (req, res) => {
    try {
        const swipeCollectionDto: SwipeCollectionDto = req.body as SwipeCollectionDto
        const collection = 'swipeCollection';

        const result = await db.collection(collection).doc(swipeCollectionDto.swipeCollectionId);
        if(result !== null){
            if(swipeCollectionDto.userId !== null){
                await result.update({
                    members: admin.firestore.FieldValue.arrayRemove(swipeCollectionDto.userId),
                });
                res.status(200).json({removed: true});
            }
        }
        res.status(200).json({removed: false});
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/matches', async (req, res) => {
    try {
        const swipeDto: MatchesDto = req.body as MatchesDto


        const collection = 'swipeCollection';
        const subCollection = 'movies';

        let swipeCollection : SwipeCollection = (await (await db.collection(collection).doc(swipeDto.swipeCollectionId)).get()).data() as unknown as SwipeCollection;
        
        const movies : Movie[] = await db.collection(collection).doc(swipeDto.swipeCollectionId).collection(subCollection).get() as unknown as Movie[];
        let matches = [];
        if(swipeCollection !== null){
            
            movies.forEach(m => {
                if(m.likes.length === swipeCollection.members.length){
                    matches.push()
                }
            });
        }
        res.status(200).json({match: false});
        return;
    } catch (error) {
        res.status(200).json(req.body);
    }
});


//define google cloud function name
export const webApi = functions.https.onRequest(main);