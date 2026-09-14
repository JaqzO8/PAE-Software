import { ArrowRight, Trophy } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../desingSystem/primitives";
import type { LiveChallengeGame, LiveTriviaGame } from "../services/learningService";

type LiveGamePanelProps = {
  game: LiveChallengeGame | LiveTriviaGame;
  titleIconClassName?: string;
  optionAccentClassName?: string;
  onAnswer: (answer: number) => void;
  onNext: () => void;
};

export const LiveGamePanel = ({
  game,
  titleIconClassName = "text-brand-action",
  optionAccentClassName = "bg-brand-action/10 text-brand-action",
  onAnswer,
  onNext,
}: LiveGamePanelProps) => {
  return (
    <Card className="border-brand-action/30">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className={`h-5 w-5 ${titleIconClassName}`} />
              {game.room.topic}
            </CardTitle>
            <CardDescription>
              Pregunta {Math.min(game.currentQuestionIndex + 1, game.totalQuestions)} de {game.totalQuestions}
            </CardDescription>
          </div>
          <Badge variant={game.status === "finished" ? "secondary" : "default"}>
            {game.status === "finished" ? "Finalizada" : `${game.answersCount} / ${game.expectedAnswers} respuestas`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {game.currentQuestion ? (
            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-3">{game.currentQuestion.subject}</Badge>
                <p className="text-lg font-semibold text-primary-contrast">
                  {game.currentQuestion.question}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {game.currentQuestion.options.map((option, index) => (
                  <Button
                    key={`${game.currentQuestion?.id}-${index}`}
                    variant="outline"
                    className="h-auto justify-start whitespace-normal p-4 text-left"
                    onClick={() => onAnswer(index)}
                  >
                    <span className={`mr-3 rounded-full px-2 py-1 text-xs font-bold ${optionAccentClassName}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" onClick={onNext} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Siguiente
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center">
              <Trophy className={`mx-auto mb-3 h-10 w-10 ${titleIconClassName}`} />
              <p className="text-lg font-semibold text-primary-contrast">Partida finalizada</p>
              <p className="text-sm text-muted-foreground">El marcador final queda registrado para esta sala.</p>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-primary-contrast">Marcador</p>
          {game.scoreboard.map((player, index) => (
            <div key={player.id} className="flex items-center justify-between rounded-md border bg-neutral-50 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">{index + 1}. {player.name}</p>
                <p className="text-xs text-muted-foreground">{player.correctAnswers} correctas</p>
              </div>
              <Badge>{player.score} pts</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
