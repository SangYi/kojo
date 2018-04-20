import * as React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';

import LoginPage from 'app_modules/pages/LoginPage';
import MainPage from 'app_modules/pages/MainPage';
import OurApi from 'app_modules/api/OurApi';
import { Cards } from 'app_modules/types';

const initialState = {
    isAuthenticated: false,
    redirectToReferrer: false,
    displayName: '',
    email: '',
    password: '',
    remember: '',
    boardlist: [],
    memberslist: [],
    cards: []

};

type State = Readonly<typeof initialState>;

export class App extends React.Component<{}, State> {
    componentWillMount() {
        let retrievedObject: string | null = localStorage.getItem('kojo');
        if (retrievedObject) {
            this.setState(JSON.parse(retrievedObject));
        }
        this.handleGetDatabase();
    }
    readonly state: State = initialState;
    render() {
        return (
            <Router>
                <Switch>
                    <Route
                        path="/"
                        exact={false}
                        render={(props) =>
                            this.state.isAuthenticated ? (
                                <MainPage
                                    {...props}
                                    handleAddCard={this.handleAddCard}
                                    handleSaveCard={this.handleSaveCard}
                                    handleDragDropCard={this.handleDragDropCard}
                                    cards={this.state.cards}
                                    displayName={this.state.displayName}
                                    memberslist={this.state.}
                                // handleSomething={this.handleSomething}
                                />
                            ) : (
                                    <Redirect
                                        to={{
                                            pathname: '/auth/login',
                                            state: { from: props.location }
                                        }}
                                    />
                                )
                        }
                    />
                    <Route
                        path="/auth"
                        render={(props) => (
                            <LoginPage
                                {...props}
                                handleLogin={this.handleLogin}
                                handleLoginFieldChange={this.handleLoginFieldChange}
                                redirectToReferrer={this.state.redirectToReferrer}
                            />
                        )}
                    />
                </Switch>
            </Router>
        );
    }

    private handleLogin = (event: React.MouseEvent<HTMLElement>): void => {
        OurApi.authenticate(this.state.email, this.state.password, (displayName: string): void => {
            // Naive example for development purposes
            if (this.state.remember) {
                window.localStorage.setItem('kojo', JSON.stringify({
                    displayName,
                    isAuthenticated: true,
                }));
            }

            this.setState({
                email: '',
                password: '',
                displayName,
                isAuthenticated: true,
                redirectToReferrer: true
            });
        });
    }

    private handleLoginFieldChange = (event: React.FormEvent<HTMLInputElement>): void => {
        const { name, value } = event.currentTarget;
        this.setState(updateAction(name, value));
    }

    private handleGetDatabase = (): void => {
        const db = OurApi.getDatabase();

        const boardlist = db.boards;
        const memberslist = db.users;
        const cards = db.cards.sort((a, b) => {
            if (a.column > b.column) {
                return 1;
            } else if (a.column < b.column) {
                return -1;
            } else {
                return 0;
            }
        });

        this.setState(updateAction('boards', boardlist));
        this.setState(updateAction('members', memberslist));
        this.setState(updateAction('cards', cards));
    }

    private handleAddCard = (CardObj: Cards): void => {
        let newCardArr = ([CardObj] as Array<never>).concat(this.state.cards);
        this.setState(updateAction('cards', newCardArr));
    }

    private handleSaveCard = (cardObj: Cards, cardIndex: number): void => {
        let newCardsArr =
            this.state.cards.slice(0, cardIndex).concat(
                ([cardObj] as Array<never>).concat(
                    this.state.cards.slice(cardIndex + 1, this.state.cards.length)
                )
            );
        this.setState(updateAction('cards', newCardsArr));
    }

    private handleDragDropCard = (
        oldCardIndex: number, // the index of the card being dragged
        dropCardIndex: number, // the index of the card being hovered over
        cardColumn: string, // the drop zone column name
        action: string // the action to place card above or below the drop target card
    ): void => {
        const { cards } = this.state;
        let newCardObj = { ...cards[oldCardIndex] as Cards, column: cardColumn };

        // If dropping into column directly, set drop card index to +1 value 
        // after the last item of the specific column
        if (action === 'DROP_COLUMN') {
            // Gotta mutate here to keep code clean
            dropCardIndex = (cards as Array<Cards>).findIndex(obj => obj.column === cardColumn) + dropCardIndex;
        }

        // Insert new Card object into Array
        let newCardsArr =
            cards.slice(0, dropCardIndex + (action === 'DROP_DOWN' ? 1 : 0)).concat(
                ([newCardObj] as Array<never>).concat(
                    cards.slice(dropCardIndex + (action === 'DROP_DOWN' ? 1 : 0), cards.length)
                )
            );

        // Delete old Card object from Array
        let deleteIndex = newCardsArr.findIndex(obj => obj === cards[oldCardIndex]);
        let newCardsArr2 =
            newCardsArr.slice(0, deleteIndex).concat(
                newCardsArr.slice(deleteIndex + 1, newCardsArr.length)
            );

        console.log(
            'old index:', oldCardIndex,
            'drop index:', dropCardIndex,
            'column:', cardColumn,
            'action:', action
        );

        this.setState(updateAction('cards', newCardsArr2));
    }

}

const updateAction = (state: string, value: (string | number | Array<Cards>)): ((state: State) => void) =>
    (prevState: State) => ({ [state]: value });

export default App;