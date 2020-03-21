import * as React from 'react';
import './App.css';

// if state = computer turn
// select random column > makeMove(column id)
// if column not full
// fill column
// update state

// reset button

// who is first

enum Player {
  None,
  One = 1,
  Two = 2
}

enum GameState {
  Ongoing = -1,
  Draw = 0,
  PlayerOneWin = Player.One,
  PlayerTwoWin = Player.Two,
}

type Board = Player[];

interface State {
  board: Board;
  playerTurn: Player;
  gameState: GameState | Player; 
  data: object;
}

// Global 
const intitializeBoard = () => {
  const board = [];
  for (let i = 0; i < 42; i++) {
    board.push(Player.None);
  }
  return board;
};

const sanitizedPlayer = (player: Player) => {
  if (player === Player.None) return 'noPlayer';
  if (player === Player.One) return 'playerOne';
  if (player === Player.Two) return 'playerTwo';
};

/**
 * make sure to start on the last row by using the column defined by (index % 7)
 * [35,36,37,38,39,40,41]
 */

const lowestEmptyIndex = (board: Board, column: number) => {
  for (let i = 35 + column; i >= 0; i -= 7) {
    if (board[i] === Player.None) return i;
  }
  return -1;
};

const togglePlayerTurn = (player: Player) => {
  return player === Player.One ? Player.Two : Player.One;
};

/**
 *       00 01 02 03 04 05 06
 *
 * 00   [00,01,02,03,04,05,06]
 * 01   [07,08,09,10,11,12,13]
 * 02   [14,15,16,17,18,19,20]
 * 03   [21,22,23,24,25,26,27]
 * 04   [28,29,30,31,32,33,34]
 * 05   [35,36,37,38,39,40,41]
 *
 */

const getGameState = (board: Board) => {
  /**
   * board slice [x,x,x,x]
   */
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column <= 4; column++) {
      const index = row * 7 + column;
      const boardSlice = board.slice(index, index + 4);
      const winningResult = checkWinningSlice(boardSlice);

      if (winningResult !== false) return winningResult;
    }
  }

  /**
   * board slice [x]
   *             [x]
   *             [x]
   *             [x]
   */
  for (let row = 0; row <= 2; row++) {
    for (let column = 0; column < 7; column++) {
      const index = row * 7 + column;
      const boardSlice = [
        board[index],
        board[index + 7],
        board[index + 7 * 2],
        board[index + 7 * 3]
      ];

      const winningResult = checkWinningSlice(boardSlice);
      if (winningResult !== false) return winningResult;
    }
  }

  /**
   * board slice
   *                   [x]
   *                [x]
   *             [x]
   *          [x]
   */

  for (let row = 0; row <= 2; row++) {
    for (let column = 0; column < 7; column++) {
      const index = row * 7 + column;

      // down-left
      if (column >= 3) {
        const boardSlice = [
          board[index],
          board[index + 7 - 1],
          board[index + 7 * 2 - 2],
          board[index + 7 * 3 - 3]
        ];

        const winningResult = checkWinningSlice(boardSlice);
        if (winningResult !== false) return winningResult;
      }

      // down-right
      if (column <= 3) {
        const boardSlice = [
          board[index],
          board[index + 7 + 1],
          board[index + 7 * 2 + 2],
          board[index + 7 * 3 + 3]
        ];

        const winningResult = checkWinningSlice(boardSlice);
        if (winningResult !== false) return winningResult;
      }
    }
  }
  
// check for draw situation 
  if (board.some(cell => cell === Player.None)) {
    return GameState.Ongoing;
  } else {
    return GameState.Draw;
  }
};

/**
 * check if all cells in miniboard are the same player
 *   0 1 2 3
 *  [x,x,x,x]
 */

const checkWinningSlice = (miniBoard: Player[]) => {
  if (miniBoard.some(cell => cell === Player.None)) return false;

  if (
    miniBoard[0] === miniBoard[1] &&
    miniBoard[1] === miniBoard[2] &&
    miniBoard[2] === miniBoard[3]
  ) {
    return miniBoard[1];
  }

  return false;
};

class App extends React.Component<{}, State> {
  state: State = {
    board: intitializeBoard(),
    playerTurn: Player.One,
    gameState: GameState.Ongoing,
    data: {}
    
  };


  callAPI = async () => {
    const res = await fetch('/express');
    const body = await res.json()

    if(res.status !== 200 ) {
      throw Error(body.message)
    }

    return body
  }

  renderCells = () => {
    const { board } = this.state;
    return board.map((player, index) => this.renderCell(player, index));
  };

  handleOnClick = (index: number) => () => {
    const { gameState } = this.state;

    if (gameState !== GameState.Ongoing) return;

    const column = index % 7; // to find a column

    this.makeMove(column);
  };

  makeMove(column: number) {
    const { board, playerTurn } = this.state;

    const index = lowestEmptyIndex(board, column);

    const newBoard = board.slice();

    newBoard[index] = playerTurn;

    const gameState = getGameState(newBoard);

    this.setState({
      board: newBoard,
      playerTurn: togglePlayerTurn(playerTurn),
      gameState
    });
  }

  renderCell = (player: Player, index: number) => {
    return (
      <div
        className="cell"
        key={index}
        onClick={this.handleOnClick(index)}
        data-player={sanitizedPlayer(player)}
      />
    );
  };

  renderGameStatus = () => {
    const { gameState } = this.state;

    let text;
    if (gameState === GameState.Ongoing) {
      text = 'Game is ongoing';
    } else if (gameState === GameState.Draw) {
      text = 'Game is a draw';
    } else if (gameState === GameState.PlayerOneWin) {
      text = 'Player one won';
    } else if (gameState === GameState.PlayerTwoWin) {
      text = 'Player two won';
    }

    return <div>{text}</div>;
  };

  render() {
    return (
      <div className="App">
        {this.renderGameStatus()}
        <div className="board">{this.renderCells()}</div>
      </div>
    );
  }
}

export default App;
