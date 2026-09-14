import { useEffect, useMemo, useState } from "react";
import { Database, Download, FileUp, Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../desingSystem/primitives";
import { useToast } from "../../hooks/useToast";
import {
  createQuestion,
  exportQuestions,
  getQuestionBank,
  importQuestions,
  type BankQuestion,
  type CreateQuestionData,
} from "../../features/learning/services/learningService";
import styles from "../../features/learning/components/learning.module.css";

const emptyForm: CreateQuestionData = {
  universityId: "unmsm",
  materia: "",
  tema: "",
  dificultad: "medio",
  tipo: "opcion_multiple",
  enunciado: "",
  opciones: ["", "", "", ""],
  respuesta_correcta: 0,
  respuesta_texto: "",
  explicacion: "",
  etiquetas: [],
};

const QuestionBank = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [type, setType] = useState("all");
  const [form, setForm] = useState<CreateQuestionData>(emptyForm);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    loadQuestions();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesType = type === "all" || question.tipo === type;
      return matchesType;
    });
  }, [questions, type]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      setQuestions(await getQuestionBank({
        search: search || undefined,
        dificultad: difficulty === "all" ? undefined : difficulty,
      }));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "No se pudo cargar el banco",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const opciones = [...form.opciones];
    opciones[index] = value;
    setForm((prev) => ({ ...prev, opciones }));
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...form,
        opciones: form.tipo === "opcion_multiple" ? form.opciones.filter(Boolean) : [],
        respuesta_correcta: form.tipo === "opcion_multiple" ? form.respuesta_correcta : undefined,
      };
      const created = await createQuestion(payload);
      setQuestions((prev) => [created, ...prev]);
      setForm(emptyForm);
      toast({ title: "Pregunta creada", description: "Ya esta disponible para simulacros" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "No se pudo crear la pregunta",
      });
    }
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      const list = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(list)) throw new Error("Formato invalido");

      const imported = await importQuestions(list);
      setQuestions((prev) => [...imported, ...prev]);
      setImportText("");
      toast({ title: "Importacion completada", description: `${imported.length} preguntas agregadas` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "JSON invalido",
        description: error.response?.data?.message || "Revisa el formato de importacion",
      });
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-action/10 rounded-xl">
            <Database className="h-6 w-6 text-brand-action" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-contrast">Banco de Preguntas</h1>
            <p className="text-muted-foreground">Gestiona preguntas, solucionarios y metadatos para simulacros.</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportQuestions}>
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por enunciado o tema" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="facil">Facil</SelectItem>
                <SelectItem value="medio">Medio</SelectItem>
                <SelectItem value="dificil">Dificil</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="opcion_multiple">Opcion multiple</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadQuestions} disabled={isLoading}>
              <SlidersHorizontal className="h-4 w-4" /> Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-brand-action" />
                Nueva pregunta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Universidad</Label>
                  <Select value={form.universityId} onValueChange={(value) => setForm((prev) => ({ ...prev, universityId: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unmsm">UNMSM</SelectItem>
                      <SelectItem value="uni">UNI</SelectItem>
                      <SelectItem value="pucp">PUCP</SelectItem>
                      <SelectItem value="unfv">UNFV</SelectItem>
                      <SelectItem value="unac">UNAC</SelectItem>
                      <SelectItem value="upn">UPN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dificultad</Label>
                  <Select value={form.dificultad} onValueChange={(value: any) => setForm((prev) => ({ ...prev, dificultad: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Facil</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="dificil">Dificil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Materia</Label>
                  <Input value={form.materia} onChange={(e) => setForm((prev) => ({ ...prev, materia: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Input value={form.tema} onChange={(e) => setForm((prev) => ({ ...prev, tema: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(value: any) => setForm((prev) => ({ ...prev, tipo: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opcion_multiple">Opcion multiple</SelectItem>
                    <SelectItem value="abierta">Abierta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Enunciado</Label>
                <Textarea className="min-h-24" value={form.enunciado} onChange={(e) => setForm((prev) => ({ ...prev, enunciado: e.target.value }))} />
              </div>

              {form.tipo === "opcion_multiple" ? (
                <div className="space-y-3">
                  <Label>Opciones</Label>
                  {form.opciones.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={option} onChange={(e) => updateOption(index, e.target.value)} placeholder={`Opcion ${index + 1}`} />
                      <Button
                        type="button"
                        variant={form.respuesta_correcta === index ? "default" : "outline"}
                        size="icon"
                        onClick={() => setForm((prev) => ({ ...prev, respuesta_correcta: index }))}
                        title="Marcar correcta"
                      >
                        {String.fromCharCode(65 + index)}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Respuesta esperada</Label>
                  <Textarea value={form.respuesta_texto} onChange={(e) => setForm((prev) => ({ ...prev, respuesta_texto: e.target.value }))} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Explicacion</Label>
                <Textarea value={form.explicacion} onChange={(e) => setForm((prev) => ({ ...prev, explicacion: e.target.value }))} />
              </div>

              <Button className="w-full bg-brand-action hover:bg-brand-action/90" onClick={handleCreate}>
                <Plus className="h-4 w-4" /> Guardar pregunta
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-brand-action" />
                Importar JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                className="min-h-32 font-mono text-xs"
                placeholder='[{"universityId":"unmsm","materia":"Matematicas","enunciado":"...","opciones":["A","B"],"respuesta_correcta":0}]'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <Button variant="outline" className="w-full" onClick={handleImport}>
                <FileUp className="h-4 w-4" /> Importar
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preguntas ({filteredQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredQuestions.map((question) => (
              <div key={question.id_pregunta} className="rounded-md border p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{question.materia}</Badge>
                  <Badge variant="outline">{question.dificultad}</Badge>
                  <Badge variant={question.tipo === "abierta" ? "default" : "outline"}>
                    {question.tipo === "abierta" ? "Abierta" : "Opcion multiple"}
                  </Badge>
                  {question.universidad && <Badge variant="outline">{question.universidad.slug?.toUpperCase()}</Badge>}
                </div>
                <p className="font-semibold text-primary-contrast">{question.enunciado}</p>
                {question.opciones?.length > 0 && (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {question.opciones.map((option, index) => (
                      <div key={`${question.id_pregunta}-${index}`} className="rounded border bg-neutral-50 px-3 py-2 text-sm">
                        <span className="font-bold">{String.fromCharCode(65 + index)}.</span> {option}
                      </div>
                    ))}
                  </div>
                )}
                {question.explicacion && (
                  <p className="mt-3 text-sm text-muted-foreground">{question.explicacion}</p>
                )}
              </div>
            ))}
            {!isLoading && filteredQuestions.length === 0 && (
              <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
                No hay preguntas con esos filtros
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestionBank;
