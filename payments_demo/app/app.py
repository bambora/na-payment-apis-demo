from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def test():
  perams = request.args
  print('searchword')
  print(searchword)
  return render_template('hello.html', perams=perams)

if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0')
